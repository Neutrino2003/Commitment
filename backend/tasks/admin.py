"""
Tasks App Django Admin Configuration
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Task, TaskList, Tag


@admin.register(TaskList)
class TaskListAdmin(admin.ModelAdmin):
    """Enhanced TaskList admin"""
    list_display = ['name', 'user_link', 'color_badge', 'is_default', 'task_count', 'created_at']
    list_filter = ['is_default', 'created_at', 'updated_at']
    search_fields = ['name', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('List Information', {
            'fields': ('user', 'name', 'color', 'is_default')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_link(self, obj):
        """Link to user"""
        url = reverse('admin:users_customuser_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    
    def color_badge(self, obj):
        """Display color as badge"""
        if obj.color:
            return format_html(
                '<span style="display:inline-block; width:50px; height:20px; background-color:{}; border:1px solid #ccc;"></span>',
                obj.color
            )
        return '-'
    color_badge.short_description = 'Color'
    
    def task_count(self, obj):
        """Count of tasks in this list"""
        return obj.tasks.count()
    task_count.short_description = 'Tasks'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Enhanced Tag admin"""
    list_display = ['name', 'user_link', 'color_badge', 'task_count', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['name', 'user__username']
    readonly_fields = ['created_at']
    
    def user_link(self, obj):
        """Link to user"""
        url = reverse('admin:users_customuser_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    
    def color_badge(self, obj):
        """Display color as badge"""
        if obj.color:
            return format_html(
                '<span style="display:inline-block; padding:3px 10px; background-color:{}; color:white; border-radius:3px;">{}</span>',
                obj.color, obj.name
            )
        return obj.name
    color_badge.short_description = 'Display'
    
    def task_count(self, obj):
        """Count of tasks with this tag"""
        return obj.tasks.count()
    task_count.short_description = 'Tasks'


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Enhanced Task admin with advanced features"""
    list_display = [
        'title', 'user_link', 'list_link', 'priority_badge', 
        'completion_badge', 'due_date', 'commitment_link', 'created_at'
    ]
    list_filter = ['is_completed', 'priority', 'task_list', 'created_at', 'due_date']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    filter_horizontal = ['tags']
    date_hierarchy = 'created_at'
    actions = ['mark_completed', 'mark_incomplete', 'set_high_priority', 'set_low_priority']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'description')
        }),
        ('Organization', {
            'fields': ('task_list', 'parent', 'tags')
        }),
        ('Scheduling', {
            'fields': ('due_date', 'is_all_day', 'priority')
        }),
        ('Status', {
            'fields': ('is_completed', 'completed_at')
        }),
        ('Integration', {
            'fields': ('commitment',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_link(self, obj):
        """Link to user"""
        url = reverse('admin:users_customuser_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    
    def list_link(self, obj):
        """Link to task list"""
        if obj.task_list:
            url = reverse('admin:tasks_tasklist_change', args=[obj.task_list.id])
            return format_html('<a href="{}">{}</a>', url, obj.task_list.name)
        return '-'
    list_link.short_description = 'List'
    
    def priority_badge(self, obj):
        """Colored priority badge"""
        colors = {
            'high': '#dc3545',
            'medium': '#ffc107',
            'low': '#28a745',
        }
        color = colors.get(obj.priority, '#6c757d')
        return format_html(
            '<span style="padding: 3px 8px; background-color: {}; color: white; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.priority.upper()
        )
    priority_badge.short_description = 'Priority'
    
    def completion_badge(self, obj):
        """Completion status badge"""
        if obj.is_completed:
            return format_html('<span style="color: green; font-weight: bold;">✓ Done</span>')
        return format_html('<span style="color: orange; font-weight: bold;">○ Pending</span>')
    completion_badge.short_description = 'Status'
    
    def commitment_link(self, obj):
        """Link to related commitment"""
        if obj.commitment:
            url = reverse('admin:commitments_commitment_change', args=[obj.commitment.id])
            return format_html('<a href="{}">#{}</a>', url, obj.commitment.id)
        return '-'
    commitment_link.short_description = 'Commitment'
    
    # Bulk actions
    def mark_completed(self, request, queryset):
        """Mark selected tasks as completed"""
        updated = queryset.update(is_completed=True)
        self.message_user(request, f'{updated} task(s) marked as completed.')
    mark_completed.short_description = 'Mark as completed'
    
    def mark_incomplete(self, request, queryset):
        """Mark selected tasks as incomplete"""
        updated = queryset.update(is_completed=False)
        self.message_user(request, f'{updated} task(s) marked as incomplete.')
    mark_incomplete.short_description = 'Mark as incomplete'
    
    def set_high_priority(self, request, queryset):
        """Set priority to high"""
        updated = queryset.update(priority='high')
        self.message_user(request, f'{updated} task(s) set to high priority.')
    set_high_priority.short_description = 'Set to high priority'
    
    def set_low_priority(self, request, queryset):
        """Set priority to low"""
        updated = queryset.update(priority='low')
        self.message_user(request, f'{updated} task(s) set to low priority.')
    set_low_priority.short_description = 'Set to low priority'
