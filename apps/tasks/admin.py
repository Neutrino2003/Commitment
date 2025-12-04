"""
Admin interface for Task Management models.
Provides user-friendly interface for managing tasks, lists, tags, and habits.
"""
from django.contrib import admin
from treebeard.admin import TreeAdmin
from .models import List, Tag, Task, Habit, HabitLog


@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'sort_order', 'created_at']
    list_filter = ['user', 'created_at']
    search_fields = ['name', 'user__username']
    ordering = ['user', 'sort_order', 'created_at']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'created_at']
    list_filter = ['user', 'created_at']
    search_fields = ['name', 'user__username']
    ordering = ['user', 'name']


@admin.register(Task)
class TaskAdmin(TreeAdmin):
    """
    TreeAdmin from treebeard provides tree manipulation UI.
    """
    list_display = [
        'title', 'user', 'list', 'status', 'priority',
        'due_date', 'kanban_order', 'created_at'
    ]
    list_filter = ['status', 'priority', 'user', 'list', 'created_at']
    search_fields = ['title', 'notes', 'user__username']
    filter_horizontal = ['tags']
    ordering = ['user', 'kanban_order', 'created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'notes', 'status')
        }),
        ('Organization', {
            'fields': ('list', 'tags', 'priority', 'kanban_order')
        }),
        ('Scheduling', {
            'fields': ('due_date', 'start_date', 'duration_minutes', 'recurrence')
        }),
        ('Completion', {
            'fields': ('completed_at',)
        }),
    )


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'user', 'frequency', 'target_days',
        'is_active', 'sort_order', 'created_at'
    ]
    list_filter = ['frequency', 'is_active', 'user', 'created_at']
    search_fields = ['name', 'description', 'user__username']
    ordering = ['user', 'sort_order', 'created_at']


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ['habit', 'date', 'completed', 'created_at']
    list_filter = ['completed', 'date', 'habit__user']
    search_fields = ['habit__name', 'notes']
    ordering = ['-date']
    date_hierarchy = 'date'
