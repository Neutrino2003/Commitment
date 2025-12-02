"""
Habits App Django Admin Configuration
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Habit, HabitLog


class HabitLogInline(admin.TabularInline):
    """Inline display of habit logs"""
    model = HabitLog
    extra = 0
    readonly_fields = ('date', 'completed', 'created_at')
    can_delete = True
    max_num = 10  # Show only latest 10


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    """Enhanced Habit admin"""
    list_display = [
        'title', 'user_link', 'days_display', 
        'streak_display', 'created_at'
    ]
    list_filter = ['created_at', 'updated_at']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'current_streak', 'best_streak']
    inlines = [HabitLogInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'description')
        }),
        ('Schedule', {
            'fields': ('days_of_week',)
        }),
        ('Progress Tracking', {
            'fields': ('current_streak', 'best_streak'),
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
    
    def days_display(self, obj):
        """Display days of week"""
        if obj.days_of_week:
            days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            selected = [days[int(d)] for d in obj.days_of_week.split(',') if d.isdigit() and int(d) < 7]
            return ', '.join(selected) if selected else 'All days'
        return 'All days'
    days_display.short_description = 'Days'
    
    def streak_display(self, obj):
        """Display current streak with emoji"""
        if obj.current_streak >= obj.best_streak and obj.current_streak > 0:
            emoji = '🔥'  # Fire for best streak
        elif obj.current_streak >= 7:
            emoji = '⭐'  # Star for good streak
        elif obj.current_streak > 0:
            emoji = '✓'  # Checkmark for active
        else:
            emoji = '○'  # Circle for none
        
        return format_html(
            '<span style="font-weight: bold;">{} {} <span style="color: #999;">(best: {})</span></span>',
            emoji, obj.current_streak, obj.best_streak
        )
    streak_display.short_description = 'Current Streak'


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    """Enhanced Habit Log admin"""
    list_display = ['habit_link', 'user_link', 'date', 'completion_badge', 'notes_preview', 'created_at']
    list_filter = ['completed', 'date', 'created_at']
    search_fields = ['habit__title', 'notes', 'habit__user__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'date'
    actions = ['mark_completed', 'mark_incomplete']
    
    fieldsets = (
        ('Log Information', {
            'fields': ('habit', 'date', 'completed', 'notes')
        }),
        ('Timestamp', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def habit_link(self, obj):
        """Link to habit"""
        url = reverse('admin:habits_habit_change', args=[obj.habit.id])
        return format_html('<a href="{}">{}</a>', url, obj.habit.title)
    habit_link.short_description = 'Habit'
    
    def user_link(self, obj):
        """Link to user"""
        url = reverse('admin:users_customuser_change', args=[obj.habit.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.habit.user.username)
    user_link.short_description = 'User'
    
    def completion_badge(self, obj):
        """Completion status badge"""
        if obj.completed:
            return format_html('<span style="color: green; font-weight: bold;">✓ Completed</span>')
        return format_html('<span style="color: red;">✗ Skipped</span>')
    completion_badge.short_description = 'Status'
    
    def notes_preview(self, obj):
        """Preview of notes"""
        if obj.notes:
            return obj.notes[:50] + '...' if len(obj.notes) > 50 else obj.notes
        return '-'
    notes_preview.short_description = 'Notes'
    
    # Bulk actions
    def mark_completed(self, request, queryset):
        """Mark logs as completed"""
        updated = queryset.update(completed=True)
        self.message_user(request, f'{updated} log(s) marked as completed.')
    mark_completed.short_description = 'Mark as completed'
    
    def mark_incomplete(self, request, queryset):
        """Mark logs as incomplete"""
        updated = queryset.update(completed=False)
        self.message_user(request, f'{updated} log(s) marked as incomplete.')
    mark_incomplete.short_description = 'Mark as incomplete'
