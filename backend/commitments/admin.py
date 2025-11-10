from django.contrib import admin
from .models import Commitment


@admin.register(Commitment)
class CommitmentAdmin(admin.ModelAdmin):
    """Commitment admin"""
    list_display = ('title', 'user', 'stake_amount', 'frequency', 'status', 'created_at')
    list_filter = ('status', 'frequency', 'evidence_type', 'leniency', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    readonly_fields = ('created_at', 'updated_at', 'activated_at', 'completed_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'description', 'status')
        }),
        ('Financial', {
            'fields': ('stake_amount', 'currency')
        }),
        ('Scheduling', {
            'fields': ('start_time', 'end_time', 'frequency', 'custom_days')
        }),
        ('Requirements', {
            'fields': ('evidence_required', 'evidence_type', 'leniency')
        }),
        ('Evidence', {
            'fields': ('evidence_file', 'evidence_text', 'evidence_submitted', 'evidence_submitted_at')
        }),
        ('Complaints', {
            'fields': ('complaints_flagged', 'complaint')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'activated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
