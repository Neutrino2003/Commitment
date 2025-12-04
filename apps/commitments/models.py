"""
Commitments App Models

This module defines the accountability layer for task management.
A Commitment is a "Power-Up" that adds stakes and verification to a Task.

Key Models:
- Commitment: The core accountability contract linked to a Task
- Complaint: User appeals for failed commitments
- EvidenceVerification: Admin verification workflow for submitted evidence
"""
from django.db import models, transaction
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.utils import timezone
from decimal import Decimal


class Commitment(models.Model):
    """
    Accountability contract linked to a Task.
    
    The Task handles *What* and *When*.
    The Commitment handles *What happens if I don't*.
    
    A Task can exist without a Commitment (simple todo).
    A Commitment always requires a Task (even if auto-created).
    """
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('paused', 'Paused'),
        ('appealed', 'Appealed'),
        ('under_review', 'Under Review'),
    ]
    
    LENIENCY_CHOICES = [
        ('lenient', 'Lenient - Easy appeal requirements'),
        ('normal', 'Normal - Standard appeal requirements'),
        ('hard', 'Hard - Strict appeal requirements'),
    ]
    
    EVIDENCE_TYPE_CHOICES = [
        ('photo', 'Photo Upload'),
        ('timelapse_video', 'Timelapse Video'),
        ('self_verification', 'Self-Verification'),
        ('manual', 'Manual Verification'),
    ]
    
    STAKE_TYPE_CHOICES = [
        ('social', 'Social Accountability'),
        ('points', 'Virtual Points'),
        ('money', 'Real Money'),
    ]
    
    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupees'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
    ]
    
    # ========== CORE RELATIONSHIP ==========
    # OneToOne: A Task has at most one active Commitment
    task = models.OneToOneField(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='commitment',
        help_text='The task this commitment is attached to'
    )
    
    # ========== STATUS & STAKES ==========
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    
    stake_type = models.CharField(
        max_length=20,
        choices=STAKE_TYPE_CHOICES,
        default='social',
        db_index=True,
        help_text='Type of stake: social pressure, virtual points, or real money'
    )
    stake_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        null=True,
        blank=True,
        help_text='Amount at stake (required for money type)'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='INR'
    )
    leniency = models.CharField(
        max_length=10,
        choices=LENIENCY_CHOICES,
        default='normal'
    )
    
    # ========== EVIDENCE & VERIFICATION ==========
    evidence_required = models.BooleanField(default=True)
    evidence_type = models.CharField(
        max_length=30,
        choices=EVIDENCE_TYPE_CHOICES,
        default='self_verification'
    )
    evidence_file = models.FileField(
        upload_to='commitment_evidence/%Y/%m/%d/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi'])]
    )
    evidence_text = models.TextField(
        blank=True,
        help_text='Text evidence (notes, description, etc.)'
    )
    evidence_submitted = models.BooleanField(default=False)
    evidence_submitted_at = models.DateTimeField(blank=True, null=True)
    
    # ========== COMPLAINT ==========
    complaints_flagged = models.BooleanField(default=False)
    complaint = models.TextField(blank=True, null=True)
    
    # ========== TIMESTAMPS ==========
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'commitments'
        verbose_name = "Commitment"
        verbose_name_plural = "Commitments"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['stake_type', 'status']),
        ]
    
    def __str__(self):
        return f"Commitment: {self.task.title} ({self.get_status_display()})"
    
    # ========== PROPERTIES ==========
    @property
    def user(self):
        """Get user from linked task"""
        return self.task.user
    
    @property
    def title(self):
        """Get title from linked task"""
        return self.task.title
    
    @property
    def due_date(self):
        """Get due date from linked task"""
        return self.task.due_date
    
    @property
    def is_active(self):
        """Check if commitment is currently active"""
        return self.status == 'active'
    
    @property
    def is_overdue(self):
        """Check if commitment is past deadline and not resolved"""
        if self.status not in ['active', 'under_review']:
            return False
        if not self.task.due_date:
            return False
        return timezone.now() > self.task.due_date
    
    @property
    def is_paid_commitment(self):
        """Check if this is a financial commitment"""
        return self.stake_type == 'money'
    
    # ========== STATE TRANSITIONS ==========
    def activate(self):
        """Activate a draft commitment"""
        if self.status != 'draft':
            raise ValueError(f"Only draft commitments can be activated, this is {self.status}")
        
        if self.task.due_date and self.task.due_date <= timezone.now():
            raise ValueError("Cannot activate commitment with past deadline")
        
        with transaction.atomic():
            self.status = 'active'
            self.activated_at = timezone.now()
            self.save()
        return self
    
    def submit_evidence(self, evidence_type=None, evidence_file=None, evidence_text=''):
        """Submit evidence for completion"""
        if self.status not in ['active', 'paused']:
            raise ValueError(f"Cannot submit evidence for {self.status} commitment")
        
        if self.evidence_required and not evidence_type:
            raise ValueError("Evidence type is required for this commitment")
        
        if self.task.due_date and timezone.now() > self.task.due_date:
            raise ValueError("Cannot submit evidence after deadline")
        
        if evidence_type:
            self.evidence_type = evidence_type
        if evidence_file:
            self.evidence_file = evidence_file
        if evidence_text:
            self.evidence_text = evidence_text
        
        self.evidence_submitted = True
        self.evidence_submitted_at = timezone.now()
        
        # Self-verification is instant, others need review
        if self.evidence_type != 'self_verification':
            self.status = 'under_review'
        
        self.save()
        return self
    
    def mark_completed(self):
        """Mark commitment as completed"""
        if self.status in ['completed', 'cancelled']:
            raise ValueError(f"Cannot complete a {self.status} commitment")
        
        if self.status == 'failed':
            raise ValueError("Cannot complete failed commitment. Use complaint system to appeal.")
        
        if self.evidence_type != 'self_verification' and self.status != 'under_review':
            raise ValueError("This commitment requires evidence verification before completion")
        
        with transaction.atomic():
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.save()
            
            # Also complete the linked task
            if self.task.status != 'COMPLETED':
                self.task.status = 'COMPLETED'
                self.task.completed_at = timezone.now()
                self.task.save()
        
        return self
    
    def mark_failed(self, reason=''):
        """Mark commitment as failed"""
        if self.status in ['completed', 'cancelled', 'failed']:
            raise ValueError(f"Cannot fail a {self.status} commitment")
        
        with transaction.atomic():
            self.status = 'failed'
            if reason:
                self.complaint = reason
            self.completed_at = timezone.now()
            self.save()
        
        return self
    
    def cancel(self):
        """Cancel a commitment"""
        if self.status in ['completed', 'failed', 'cancelled']:
            raise ValueError(f"Cannot cancel a {self.status} commitment")
        
        with transaction.atomic():
            self.status = 'cancelled'
            self.save()
        return self
    
    def pause(self):
        """Pause an active commitment"""
        if self.status not in ['active', 'under_review']:
            raise ValueError("Only active or under_review commitments can be paused")
        
        with transaction.atomic():
            self.status = 'paused'
            self.save()
        return self
    
    def resume(self):
        """Resume a paused commitment"""
        if self.status != 'paused':
            raise ValueError("Only paused commitments can be resumed")
        
        if self.task.due_date and timezone.now() > self.task.due_date:
            raise ValueError("Cannot resume overdue commitment")
        
        with transaction.atomic():
            if self.evidence_submitted:
                self.status = 'under_review'
            else:
                self.status = 'active'
            self.save()
        return self


class Complaint(models.Model):
    """Model to track user complaints/appeals about failed commitments"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved - Refund Granted'),
        ('rejected', 'Rejected'),
    ]
    
    REASON_CHOICES = [
        ('technical_issue', 'Technical Issue'),
        ('emergency', 'Emergency/Unforeseen Circumstance'),
        ('illness', 'Illness'),
        ('evidence_issue', 'Evidence Submission Issue'),
        ('deadline_dispute', 'Deadline Dispute'),
        ('other', 'Other'),
    ]
    
    # Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaints'
    )
    commitment = models.ForeignKey(
        Commitment,
        on_delete=models.CASCADE,
        related_name='complaints'
    )
    
    # Complaint details
    reason_category = models.CharField(
        max_length=30,
        choices=REASON_CHOICES,
        default='other'
    )
    description = models.TextField(help_text='Detailed explanation of the complaint')
    evidence_file = models.FileField(
        upload_to='complaint_evidence/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text='Supporting evidence for the complaint'
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Admin review
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_complaints',
        help_text='Admin who reviewed this complaint'
    )
    review_notes = models.TextField(blank=True, help_text='Admin notes on the review decision')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Refund tracking
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    refund_processed = models.BooleanField(default=False)
    refund_processed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'commitment_complaints'
        verbose_name = "Complaint"
        verbose_name_plural = "Complaints"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['commitment', 'status']),
        ]
    
    def __str__(self):
        return f"Complaint #{self.id} - {self.user.username} - {self.get_status_display()}"
    
    @property
    def is_pending(self):
        return self.status == 'pending'
    
    @property
    def is_resolved(self):
        return self.status in ['approved', 'rejected']
    
    def approve(self, reviewed_by, review_notes='', refund_amount=None):
        """Approve complaint and set refund amount"""
        if self.status in ['approved', 'rejected']:
            raise ValueError(f"Cannot approve complaint with status: {self.status}")
        
        with transaction.atomic():
            self.status = 'approved'
            self.reviewed_by = reviewed_by
            self.review_notes = review_notes
            self.reviewed_at = timezone.now()
            
            if refund_amount is not None:
                self.refund_amount = refund_amount
            elif self.commitment.stake_amount:
                self.refund_amount = self.commitment.stake_amount
            
            self.save()
            
            # Update commitment status
            if self.commitment.status == 'failed':
                self.commitment.status = 'appealed'
                self.commitment.save()
        
        return self
    
    def reject(self, reviewed_by, review_notes=''):
        """Reject complaint"""
        if self.status in ['approved', 'rejected']:
            raise ValueError(f"Cannot reject complaint with status: {self.status}")
        
        with transaction.atomic():
            self.status = 'rejected'
            self.reviewed_by = reviewed_by
            self.review_notes = review_notes
            self.reviewed_at = timezone.now()
            self.save()
        return self


class EvidenceVerification(models.Model):
    """Model to track evidence verification by admins"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_more_info', 'Needs More Information'),
    ]
    
    # Relationships
    commitment = models.OneToOneField(
        Commitment,
        on_delete=models.CASCADE,
        related_name='evidence_verification'
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_evidences',
        help_text='Admin who verified this evidence'
    )
    
    # Verification details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    notes = models.TextField(blank=True, help_text='Admin notes on verification')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'commitment_evidence_verifications'
        verbose_name = "Evidence Verification"
        verbose_name_plural = "Evidence Verifications"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Evidence Verification for {self.commitment.task.title} - {self.get_status_display()}"
    
    @property
    def is_pending(self):
        return self.status == 'pending'
    
    def approve(self, verified_by, notes=''):
        """Approve evidence and complete commitment"""
        if self.status in ['approved', 'rejected']:
            raise ValueError(f"Cannot approve verification with status: {self.status}")
        
        with transaction.atomic():
            self.status = 'approved'
            self.verified_by = verified_by
            self.notes = notes
            self.verified_at = timezone.now()
            self.save()
            
            # Mark commitment as completed
            if self.commitment.status in ['active', 'under_review']:
                self.commitment.mark_completed()
        
        return self
    
    def reject(self, verified_by, notes=''):
        """Reject evidence and mark commitment as failed"""
        if self.status in ['approved', 'rejected']:
            raise ValueError(f"Cannot reject verification with status: {self.status}")
        
        with transaction.atomic():
            self.status = 'rejected'
            self.verified_by = verified_by
            self.notes = notes
            self.verified_at = timezone.now()
            self.save()
            
            # Mark commitment as failed
            if self.commitment.status in ['active', 'under_review']:
                self.commitment.mark_failed(reason=f'Evidence rejected: {notes}')
        
        return self
    
    def request_more_info(self, verified_by, notes=''):
        """Request more information from user"""
        self.status = 'needs_more_info'
        self.verified_by = verified_by
        self.notes = notes
        self.verified_at = timezone.now()
        self.save()
        return self
