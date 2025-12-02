"""
Tasks App Serializers

Defines serializers for CRUD operations and custom actions.
"""
from rest_framework import serializers
from .models import Task, TaskList, Tag
from commitments.models import Commitment


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model"""

    class Meta:
        model = Tag
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['created_at']

    def create(self, validated_data):
        # Automatically set user from request context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for TaskList model"""
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = TaskList
        fields = ['id', 'name', 'color', 'is_default', 'task_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_task_count(self, obj):
        """Get count of active tasks in this list"""
        return obj.tasks.filter(is_completed=False).count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    """
    Full serializer for Task model with all relationships.
    Used for GET requests.
    """
    tags = TagSerializer(many=True, read_only=True)
    task_list_name = serializers.CharField(source='task_list.name', read_only=True)
    has_commitment = serializers.BooleanField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    subtasks = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'task_list', 'task_list_name',
            'parent', 'due_date', 'is_all_day', 'priority', 'tags',
            'is_completed', 'completed_at', 'has_commitment', 'is_overdue',
            'subtasks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['completed_at', 'created_at', 'updated_at']

    def get_subtasks(self, obj):
        """Get immediate subtasks (not recursive)"""
        if obj.subtasks.exists():
            return TaskSerializer(obj.subtasks.all(), many=True, context=self.context).data
        return []


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating tasks.
    Handles tag IDs as input.
    """
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'task_list', 'parent',
            'due_date', 'is_all_day', 'priority', 'tag_ids',
            'is_completed'
        ]

    def validate_task_list(self, value):
        """Ensure task list belongs to the user"""
        if value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only add tasks to your own lists.")
        return value

    def validate_parent(self, value):
        """Ensure parent task belongs to the user"""
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("Parent task must belong to you.")
        return value

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        validated_data['user'] = self.context['request'].user
        task = super().create(validated_data)

        # Add tags
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids, user=task.user)
            task.tags.set(tags)

        return task

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        task = super().update(instance, validated_data)

        # Update tags if provided
        if tag_ids is not None:
            tags = Tag.objects.filter(id__in=tag_ids, user=task.user)
            task.tags.set(tags)

        return task


class TaskCompleteSerializer(serializers.Serializer):
    """Serializer for completing/uncompleting a task"""
    is_completed = serializers.BooleanField()

    def update(self, instance, validated_data):
        if validated_data['is_completed']:
            instance.complete()
        else:
            instance.uncomplete()
        return instance


class TaskBoostSerializer(serializers.Serializer):
    """
    Serializer for converting a task to a commitment (the "boost" feature).
    """
    stake_type = serializers.ChoiceField(
        choices=['social', 'points', 'money'],
        default='social'
    )
    stake_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    referee_id = serializers.IntegerField(required=False, allow_null=True)
    evidence_required = serializers.BooleanField(default=True)

    def validate(self, data):
        """Validate stake_amount is provided for money stakes"""
        if data.get('stake_type') == 'money' and not data.get('stake_amount'):
            raise serializers.ValidationError({
                'stake_amount': 'Stake amount is required for paid commitments.'
            })
        return data

    def create(self, validated_data):
        """Create a commitment linked to the task"""
        task = self.context['task']
        user = self.context['request'].user

        # Check if task already has a commitment
        if task.has_commitment:
            raise serializers.ValidationError("This task is already boosted to a commitment.")

        # Create commitment
        from users.models import CustomUser
        referee = None
        if 'referee_id' in validated_data and validated_data['referee_id']:
            try:
                referee = CustomUser.objects.get(id=validated_data['referee_id'])
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError({'referee_id': 'Referee not found.'})

        commitment = Commitment.objects.create(
            user=user,
            task=task,
            title=task.title,
            description=task.description,
            stake_type=validated_data['stake_type'],
            stake_amount=validated_data.get('stake_amount'),
            referee=referee,
            evidence_required=validated_data['evidence_required'],
            end_time=task.due_date or task.created_at,  # Use due_date or fallback
            status='active'
        )

        return commitment
