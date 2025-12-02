from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Commitment, Complaint, EvidenceVerification


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


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    """Complaint admin with review functionality"""
    list_display = (
        'id', 'user_link', 'commitment_link', 'reason_category', 
        'status_badge', 'refund_amount', 'refund_processed', 'created_at'
    )
    list_filter = ('status', 'reason_category', 'refund_processed', 'created_at', 'reviewed_at')
    search_fields = ('description', 'review_notes', 'user__username', 'commitment__title')
    readonly_fields = (
        'created_at', 'updated_at', 'reviewed_at', 'refund_processed_at',
        'user', 'commitment', 'commitment_details'
    )
    
    fieldsets = (
        ('Complaint Information', {
            'fields': ('user', 'commitment', 'commitment_details', 'reason_category', 'description', 'evidence_file')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Admin Review', {
            'fields': ('reviewed_by', 'review_notes', 'reviewed_at'),
            'classes': ('collapse',)
        }),
        ('Refund Details', {
            'fields': ('refund_amount', 'refund_processed', 'refund_processed_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_complaints', 'reject_complaints', 'mark_refund_processed']
    
    def user_link(self, obj):
        """Link to user in admin"""
        url = reverse('admin:users_customuser_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    
    def commitment_link(self, obj):
        """Link to commitment in admin"""
        url = reverse('admin:commitments_commitment_change', args=[obj.commitment.id])
        return format_html('<a href="{}">{}</a>', url, obj.commitment.title)
    commitment_link.short_description = 'Commitment'
    
    def status_badge(self, obj):
        """Colored status badge"""
        colors = {
            'pending': 'orange',
            'under_review': 'blue',
            'approved': 'green',
            'rejected': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="padding: 3px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def commitment_details(self, obj):
        """Display commitment details"""
        return format_html(
            '<strong>Title:</strong> {}<br>'
            '<strong>Stake:</strong> {} {}<br>'
            '<strong>Status:</strong> {}<br>'
            '<strong>End Time:</strong> {}<br>',
            obj.commitment.title,
            obj.commitment.stake_amount,
            obj.commitment.currency,
            obj.commitment.get_status_display(),
            obj.commitment.end_time.strftime('%Y-%m-%d %H:%M')
        )
    commitment_details.short_description = 'Commitment Details'
    
    def approve_complaints(self, request, queryset):
        """Bulk approve complaints"""
        approved = 0
        for complaint in queryset.filter(status__in=['pending', 'under_review']):
            try:
                complaint.approve(
                    reviewed_by=request.user,
                    review_notes='Bulk approved by admin'
                )
                approved += 1
            except ValueError:
                pass
        
        self.message_user(request, f'{approved} complaint(s) approved successfully.')
    approve_complaints.short_description = 'Approve selected complaints'
    
    def reject_complaints(self, request, queryset):
        """Bulk reject complaints"""
        rejected = 0
        for complaint in queryset.filter(status__in=['pending', 'under_review']):
            try:
                complaint.reject(
                    reviewed_by=request.user,
                    review_notes='Bulk rejected by admin'
                )
                rejected += 1
            except ValueError:
                pass
        
        self.message_user(request, f'{rejected} complaint(s) rejected successfully.')
    reject_complaints.short_description = 'Reject selected complaints'
    
    def mark_refund_processed(self, request, queryset):
        """Mark refunds as processed"""
        processed = 0
        for complaint in queryset.filter(status='approved', refund_processed=False):
            try:
                complaint.process_refund()
                processed += 1
            except ValueError:
                pass
        
        self.message_user(request, f'{processed} refund(s) marked as processed.')
    mark_refund_processed.short_description = 'Mark refund as processed'


@admin.register(EvidenceVerification)
class EvidenceVerificationAdmin(admin.ModelAdmin):
    """Evidence Verification admin for manual verification"""
    list_display = (
        'id', 'commitment_link', 'user_link', 'evidence_type', 
        'status_badge', 'created_at', 'verified_at'
    )
    list_filter = ('status', 'commitment__evidence_type', 'created_at', 'verified_at')
    search_fields = ('notes', 'commitment__title', 'commitment__user__username')
    readonly_fields = (
        'commitment', 'created_at', 'verified_at', 'commitment_details',
        'evidence_preview'
    )
    
    fieldsets = (
        ('Commitment Information', {
            'fields': ('commitment', 'commitment_details', 'evidence_preview')
        }),
        ('Verification Status', {
            'fields': ('status', 'notes')
        }),
        ('Admin Details', {
            'fields': ('verified_by', 'verified_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_evidence', 'reject_evidence', 'request_more_information']
    
    def commitment_link(self, obj):
        """Link to commitment in admin"""
        url = reverse('admin:commitments_commitment_change', args=[obj.commitment.id])
        return format_html('<a href="{}">{}</a>', url, obj.commitment.title)
    commitment_link.short_description = 'Commitment'
    
    def user_link(self, obj):
        """Link to user in admin"""
        url = reverse('admin:users_customuser_change', args=[obj.commitment.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.commitment.user.username)
    user_link.short_description = 'User'
    
    def evidence_type(self, obj):
        """Display evidence type"""
        return obj.commitment.get_evidence_type_display()
    evidence_type.short_description = 'Evidence Type'
    
    def status_badge(self, obj):
        """Colored status badge"""
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'needs_more_info': 'blue',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="padding: 3px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def commitment_details(self, obj):
        """Display commitment details"""
        return format_html(
            '<strong>Title:</strong> {}<br>'
            '<strong>User:</strong> {}<br>'
            '<strong>Stake:</strong> {} {}<br>'
            '<strong>Deadline:</strong> {}<br>'
            '<strong>Status:</strong> {}<br>',
            obj.commitment.title,
            obj.commitment.user.get_full_name() or obj.commitment.user.username,
            obj.commitment.stake_amount,
            obj.commitment.currency,
            obj.commitment.end_time.strftime('%Y-%m-%d %H:%M'),
            obj.commitment.get_status_display()
        )
    commitment_details.short_description = 'Commitment Details'
    
    def evidence_preview(self, obj):
        """Preview submitted evidence"""
        html = ''
        
        if obj.commitment.evidence_file:
            file_url = obj.commitment.evidence_file.url
            html += f'<strong>File:</strong> <a href="{file_url}" target="_blank">View Evidence File</a><br>'
        
        if obj.commitment.evidence_text:
            html += f'<strong>Text Evidence:</strong><br><p style="border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">{obj.commitment.evidence_text}</p>'
        
        if not html:
            html = '<em>No evidence submitted</em>'
        
        return format_html(html)
    evidence_preview.short_description = 'Evidence Preview'
    
    def approve_evidence(self, request, queryset):
        """Bulk approve evidence verifications"""
        approved = 0
        for verification in queryset.filter(status='pending'):
            try:
                verification.approve(verified_by=request.user, notes='Bulk approved by admin')
                approved += 1
            except ValueError:
                pass
        
        self.message_user(request, f'{approved} evidence verification(s) approved successfully.')
    approve_evidence.short_description = 'Approve selected verifications'
    
    def reject_evidence(self, request, queryset):
        """Bulk reject evidence verifications"""
        rejected = 0
        for verification in queryset.filter(status='pending'):
            try:
                verification.reject(verified_by=request.user, notes='Bulk rejected by admin')
                rejected += 1
            except ValueError:
                pass
        
        self.message_user(request, f'{rejected} evidence verification(s) rejected successfully.')
    reject_evidence.short_description = 'Reject selected verifications'
    
    def request_more_information(self, request, queryset):
        """Request more information for selected verifications"""
        requested = 0
        for verification in queryset.filter(status='pending'):
            try:
                verification.request_more_info(
                    verified_by=request.user,
                    notes='More information requested by admin'
                )
                requested += 1
            except ValueError:
                pass
        
        self.message_user(request, f'{requested} verification(s) marked as needing more information.')
    request_more_information.short_description = 'Request more information'
