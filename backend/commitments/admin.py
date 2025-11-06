from django.contrib import admin
from .models import Commitment


@admin.register(Commitment)
class CommitmentAdmin(admin.ModelAdmin):
    """Commitment admin"""
    list_display = ('title', 'user', 'stake_amount', 'frequency', 'status', 'completion_rate', 'created_at')
    list_filter = ('status', 'frequency', 'evidence_type', 'leniency_mode', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    readonly_fields = ('total_tasks', 'completed_tasks', 'failed_tasks', 'appealed_tasks', 'completion_rate', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'description', 'status')
        }),
        ('Financial', {
            'fields': ('stake_amount',)
        }),
        ('Scheduling', {
            'fields': ('start_date', 'end_date', 'frequency', 'custom_days', 'custom_frequency_count', 'completion_percentage')
        }),
        ('Requirements', {
            'fields': ('evidence_type', 'leniency_mode', 'digital_signature')
        }),
        ('Statistics', {
            'fields': ('total_tasks', 'completed_tasks', 'failed_tasks', 'appealed_tasks', 'completion_rate')
        }),
        ('Metadata', {
            'fields': ('is_public', 'created_at', 'updated_at', 'activated_at', 'completed_at')
        }),
    )
