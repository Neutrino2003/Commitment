from django.contrib import admin
from .models import Commitment, Complaint, EvidenceVerification


@admin.register(Commitment)
class CommitmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'task', 'status', 'stake_type', 'stake_amount', 'created_at']
    list_filter = ['status', 'stake_type', 'evidence_type']
    search_fields = ['task__title', 'task__user__username']
    readonly_fields = ['created_at', 'updated_at', 'activated_at', 'completed_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Task Link', {
            'fields': ('task',)
        }),
        ('Status & Stakes', {
            'fields': ('status', 'stake_type', 'stake_amount', 'currency', 'leniency')
        }),
        ('Evidence', {
            'fields': ('evidence_required', 'evidence_type', 'evidence_file', 'evidence_text', 
                      'evidence_submitted', 'evidence_submitted_at')
        }),
        ('Complaints', {
            'fields': ('complaints_flagged', 'complaint'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'activated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'commitment', 'reason_category', 'status', 'created_at']
    list_filter = ['status', 'reason_category', 'refund_processed']
    search_fields = ['user__username', 'commitment__task__title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at', 'refund_processed_at']
    date_hierarchy = 'created_at'


@admin.register(EvidenceVerification)
class EvidenceVerificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'commitment', 'status', 'verified_by', 'verified_at']
    list_filter = ['status']
    search_fields = ['commitment__task__title', 'notes']
    readonly_fields = ['created_at', 'verified_at']
    date_hierarchy = 'created_at'
