"""
Serializers for Task Management API.

This module provides DRF serializers for all models with:
- Nested relationships for efficient data loading
- Tree structure support for hierarchical tasks
- Recurrence field serialization
"""

from rest_framework import serializers
from .models import List, Tag, Task, Habit, HabitLog


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""
    
    class Meta:
        model = Tag
        fields = [
            'id', 'name', 'color',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ListSerializer(serializers.ModelSerializer):
    """Serializer for List model."""
    
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = List
        fields = [
            'id', 'name', 'color', 'icon', 'sort_order',
            'task_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_task_count(self, obj):
        """Return number of tasks in this list."""
        return obj.tasks.count()


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model with nested relationships.
    """
    
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Tag.objects.all(),
        source='tags'
    )
    list_name = serializers.CharField(source='list.name', read_only=True)
    
    # Treebeard fields
    parent_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    parent = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    depth = serializers.IntegerField(read_only=True)
    
    # Recurrence display
    is_recurring = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'notes', 'status', 'priority',
            'due_date', 'start_date', 'duration_minutes',
            'recurrence', 'is_recurring',
            'list', 'list_name', 'tags', 'tag_ids',
            'kanban_order', 'completed_at',
            'parent_id', 'parent', 'children_count', 'depth',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'completed_at', 'depth']
    
    def get_parent(self, obj):
        """Return parent task ID if exists."""
        parent = obj.get_parent()
        return parent.id if parent else None
    
    def get_children_count(self, obj):
        """Return number of direct children."""
        return obj.subtask_count
    
    def create(self, validated_data):
        """Handle task creation with tree positioning."""
        parent_id = validated_data.pop('parent_id', None)
        tags = validated_data.pop('tags', [])
        
        if parent_id:
            # Add as child of parent
            parent = Task.objects.get(id=parent_id)
            task = parent.add_child(**validated_data)
        else:
            # Add as root task
            task = Task.add_root(**validated_data)
        
        if tags:
            task.tags.set(tags)
        
        return task


class TaskTreeSerializer(TaskSerializer):
    """
    Serializer for Task with recursive children.
    Used for displaying full task hierarchies.
    """
    
    children = serializers.SerializerMethodField()
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['children']
    
    def get_children(self, obj):
        """Recursively serialize children."""
        children = obj.get_children()
        serializer = TaskTreeSerializer(children, many=True, context=self.context)
        return serializer.data


class HabitLogSerializer(serializers.ModelSerializer):
    """Serializer for HabitLog model."""
    
    class Meta:
        model = HabitLog
        fields = [
            'id', 'habit', 'date', 'completed', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HabitSerializer(serializers.ModelSerializer):
    """Serializer for Habit model."""
    
    streak = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()
    recent_logs = serializers.SerializerMethodField()
    
    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'frequency', 'target_days', 'recurrence',
            'sort_order', 'is_active',
            'streak', 'completion_rate', 'recent_logs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'streak', 'completion_rate']
    
    def get_streak(self, obj):
        """Get current streak using service."""
        from .services import HabitService
        return HabitService.get_habit_streak(obj)
    
    def get_completion_rate(self, obj):
        """Get 30-day completion rate."""
        from .services import HabitService
        return round(HabitService.get_habit_completion_rate(obj, days=30), 1)
    
    def get_recent_logs(self, obj):
        """Get last 7 days of logs."""
        logs = obj.logs.all()[:7]
        return HabitLogSerializer(logs, many=True).data


class SyncResponseSerializer(serializers.Serializer):
    """
    Serializer for the Sync endpoint response.
    Returns all user data in a single payload.
    """
    
    tasks = TaskSerializer(many=True)
    lists = ListSerializer(many=True)
    tags = TagSerializer(many=True)
    habits = HabitSerializer(many=True)
