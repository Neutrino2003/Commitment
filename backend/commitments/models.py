from django.db import models, transaction
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
from users.models import CustomUser
from decimal import Decimal
from dateutil.relativedelta import relativedelta


class Complaint(models.Model):
    """Model to track user complaints about failed commitments"""
    
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
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='complaints')
    commitment = models.ForeignKey('Commitment', on_delete=models.CASCADE, related_name='complaints')
    
    # Complaint details
    reason_category = models.CharField(max_length=30, choices=REASON_CHOICES, default='other')
    description = models.TextField(help_text='Detailed explanation of the complaint')
    evidence_file = models.FileField(
        upload_to='complaint_evidence/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text='Supporting evidence for the complaint'
    )
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Admin review
    reviewed_by = models.ForeignKey(
        CustomUser,
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
        verbose_name = "Complaint"
        verbose_name_plural = "Complaints"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['commitment', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Complaint #{self.id} - {self.user.username} - {self.get_status_display()}"
    
    @property
    def is_pending(self):
        """Check if complaint is pending review"""
        return self.status == 'pending'
    
    @property
    def is_resolved(self):
        """Check if complaint has been resolved"""
        return self.status in ['approved', 'rejected']
    
    def approve(self, reviewed_by, review_notes='', refund_amount=None):
        """Approve complaint and set refund amount"""
        if self.status in ['approved', 'rejected']:
            raise ValueError(f"Cannot approve complaint with status: {self.status}")
        
        with transaction.atomic():  # Wrap in transaction    
            self.status = 'approved'
            self.reviewed_by = reviewed_by
            self.review_notes = review_notes
            self.reviewed_at = timezone.now()
            
            # Set refund amount (default to full stake if not specified)
            if refund_amount is not None:
                self.refund_amount = refund_amount
            else:
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
    
    def process_refund(self):
        """Mark refund as processed"""
        if self.status != 'approved':
            raise ValueError("Can only process refund for approved complaints")
        
        if self.refund_processed:
            raise ValueError("Refund already processed")
        
        self.refund_processed = True
        self.refund_processed_at = timezone.now()
        self.save()
        return self


class Commitment(models.Model):
    
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
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('one_time', 'One-time'),
        ('custom', 'Custom'),
    ]
    
    # Add more verification methods as needed
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
    
    # Primary data
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='commitments')
    
    # Optional link to a Task (for the "boost" feature)
    task = models.OneToOneField(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commitment',
        help_text='Optional: Task that this commitment is linked to'
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField()
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='one_time')
    custom_days = models.CharField(
        max_length=20,
        blank=True,
        help_text='Comma-separated days (MON,TUE,WED,...)'
    )
    
    # Stakes (can be social, points, or monetary)
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
    # NOTE: Corrected spelling of currency default value.
    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupees'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
    ]
    currency = models.CharField(
                max_length=3,
                choices=CURRENCY_CHOICES,
                default='INR'
            )
    leniency = models.CharField(max_length=10, choices=LENIENCY_CHOICES, default='normal')
    
    
    evidence_required = models.BooleanField(default=True)
    evidence_type = models.CharField(max_length=30, choices=EVIDENCE_TYPE_CHOICES, default='self_verification')
    evidence_file = models.FileField(
        upload_to='contract_evidence/%Y/%m/%d/',
        blank=True,
        null=True
    )
    evidence_text = models.TextField(
        blank=True,
        help_text='Text evidence (notes, description, etc.)'
    )
    evidence_submitted = models.BooleanField(default=False)
    evidence_submitted_at = models.DateTimeField(blank=True, null=True)
    
    # Complaint
    complaints_flagged = models.BooleanField(default=False)
    complaint = models.TextField(blank=True, null=True)

    # Time Statistics
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    def __str__(self):
        return f"{self.title} - {self.user.username} - {self.stake_amount}"
    
    class Meta:
        verbose_name = "Commitment"
        verbose_name_plural = "Commitments"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['start_time', 'end_time']),
            models.Index(fields=['status', 'end_time']),  # For overdue queries
            models.Index(fields=['user', 'stake_type']),  # For filtering paid commitments
            models.Index(fields=['user', 'stake_type', 'status']),  # For paid commitments dashboard
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F('start_time')),
                name='end_time_after_start_time'
            ),
        ]
        
    @property
    def is_active(self):
        """Check if contract is currently active"""
        now = timezone.now()
        return (
            self.status == 'active' and self.start_time <= now and
            (self.end_time is None or now <= self.end_time)
        )
    
    @property
    def is_overdue(self):
        """Check if contract is past end_time and not completed/failed/appealed"""
        if self.status not in ['active', 'under_review']:
            return False
        return timezone.now() > self.end_time
    
    @property
    def time_remaining(self):
        """Calculate time remaining until deadline"""
        if self.status not in ['active', 'under_review']:
            return None
        time_diff = self.end_time - timezone.now()
        return max(time_diff, timedelta(0))
    
    def is_paid_commitment(self):
        """Check if this is a high-stakes financial commitment"""
        return self.stake_type == 'money'
    
    def create_next_instance(self):
        """Create next recurring instance based on frequency"""
        if self.frequency == 'one_time':
            return None
        
        from datetime import timedelta
        
        # Calculate next start_time based on frequency
        current_start = self.start_time
        current_end = self.end_time
        
        if self.frequency == 'daily':
            next_start = current_start + timedelta(days=1)
            next_end = current_end + timedelta(days=1)
        elif self.frequency == 'weekly':
            next_start = current_start + timedelta(weeks=1)
            next_end = current_end + timedelta(weeks=1)
        elif self.frequency == 'monthly':
            next_start = current_start + relativedelta(months=1)
            next_end = current_end + relativedelta(months=1)
        else:
            return None
        
        # Create new instance with active status and activation timestamp
        next_instance = Commitment.objects.create(
            user=self.user,
            title=self.title,
            description=self.description,
            stake_amount=self.stake_amount,
            currency=self.currency,
            start_time=next_start,
            end_time=next_end,
            frequency=self.frequency,
            custom_days=self.custom_days,
            evidence_type=self.evidence_type,
            evidence_required=self.evidence_required,
            leniency=self.leniency,
            status='active',
            activated_at=timezone.now()  # Set activation timestamp
        )
        
        return next_instance
    
    @property
    def is_completed_on_time(self):
        """Return True if contract completed before or on deadline, else False/None.
        Returns:
            bool | None: None if not in completed state or missing timestamp, otherwise boolean.
        """
        if self.status != 'completed' or not self.completed_at:
            return None
        return self.completed_at <= self.end_time
    
    def submit_evidence(self, evidence_type=None, evidence_data=None, evidence_text=''):
        """Submit evidence for completion - transitions to under_review for manual verification"""
        if self.status not in ['active', 'paused']:
            raise ValueError(f"Cannot submit evidence for {self.status} contract")
        
        if self.evidence_required and not evidence_type:
            raise ValueError("Evidence type is required for this contract")
        
        # Validate not past deadline (allow some grace period for submission)
        if timezone.now() > self.end_time:
            raise ValueError("Cannot submit evidence after deadline")
        
        # Store evidence
        if evidence_type:
            self.evidence_type = evidence_type
        if evidence_data:
            self.evidence_file = evidence_data
        if evidence_text:
            self.evidence_text = evidence_text
        
        # Mark evidence as submitted
        self.evidence_submitted = True
        self.evidence_submitted_at = timezone.now()
        
        # For self-verification, user can mark as completed immediately (like a to-do app)
        # For other types (photo/video/manual), needs admin verification
        if self.evidence_type == 'self_verification':
            # User will call mark_completed() directly - this just saves evidence
            pass
        else:
            # Transition to under_review for admin verification
            self.status = 'under_review'
        
        self.save()
        return self
    
    def mark_completed(self, completed_by=None, notes=''):
        """Mark contract as completed - users can do this for self-verification, admins for others"""
        if self.status in ['completed', 'cancelled']:
            raise ValueError(f"Cannot mark {self.status} contract as completed")
        
        if self.status == 'failed':
            raise ValueError("Cannot mark failed contract as completed. Use complaint system to appeal.")
        
        # For self-verification contracts, allow users to mark complete like a to-do app
        # For manual verification (photo/video/manual), only admins can complete (after verification)
        if self.evidence_type != 'self_verification' and self.status != 'under_review':
            raise ValueError("This contract requires evidence verification before completion")
        
        # Mark as completed
        with transaction.atomic():
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.save()
        
        return self
    
    def mark_failed(self, reason='', failed_by=None):
        """Mark contract as failed"""
        if self.status in ['completed', 'cancelled']:
            raise ValueError(f"Cannot mark {self.status} contract as failed")
        
        if self.status == 'failed':
            raise ValueError("Contract is already marked as failed")
        
        # Mark as failed
        with transaction.atomic():
            self.status = 'failed'
            if reason:
                self.complaint = reason
            self.completed_at = timezone.now()
            self.save()
        
        return self
    
    def auto_fail_if_overdue(self):
        """Automatically mark contract as failed if overdue and no evidence submitted"""
        if self.is_overdue and not self.evidence_submitted:
            if self.status == 'active':
                self.mark_failed(reason='Automatically failed: Deadline passed without evidence submission')
                return True
        return False
    
    def activate(self):
        """Activate a draft contract"""
        if self.status != 'draft':
            raise ValueError(f"Only draft contracts can be activated, this is {self.status}")
        
        # Validate that end_time is in the future
        if self.end_time <= timezone.now():
            raise ValueError("Cannot activate contract with past deadline")
        
        with transaction.atomic():
            self.status = 'active'
            self.activated_at = timezone.now()
            self.save()
        return self
    
    def pause(self):
        """Pause an active contract"""
        if self.status not in ['active', 'under_review']:
            raise ValueError(f"Only active or under_review contracts can be paused")
        
        with transaction.atomic():
            self.status = 'paused'
            self.save()
        return self

    def resume(self):
        """Resume a paused contract"""
        with transaction.atomic():
            if self.status != 'paused':
                raise ValueError(f"Only paused contracts can be resumed")
        
        # Check if contract is now overdue
        if timezone.now() > self.end_time:
            raise ValueError("Cannot resume overdue contract. Please create a new commitment.")
        
        # Return to previous state (active or under_review based on evidence submission)
        if self.evidence_submitted:
            self.status = 'under_review'
        else:
            self.status = 'active'
        self.save()
        return self
    
    def cancel(self):
        """Cancel a contract"""
        if self.status in ['completed', 'failed', 'cancelled']:
            raise ValueError(f"Cannot cancel a {self.status} contract")
        
        with transaction.atomic():
            self.status = 'cancelled'
            self.save()
        return self
    
    def flag_complaint(self, complaint_text):
        """Flag a complaint on the contract"""
        with transaction.atomic():
            self.complaints_flagged = True
            self.complaint = complaint_text
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
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_evidences',
        help_text='Admin who verified this evidence'
    )
    
    # Verification details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, help_text='Admin notes on verification')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Evidence Verification"
        verbose_name_plural = "Evidence Verifications"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Evidence Verification for {self.commitment.title} - {self.get_status_display()}"
    
    @property
    def is_pending(self):
        """Check if verification is pending"""
        return self.status == 'pending'
    
    def approve(self, verified_by, notes=''):
        """Approve evidence and complete commitment"""
        with transaction.atomic():
            if self.status in ['approved', 'rejected']:
                raise ValueError(f"Cannot approve verification with status: {self.status}")
        
        self.status = 'approved'
        self.verified_by = verified_by
        self.notes = notes
        self.verified_at = timezone.now()
        self.save()
        
        # Mark commitment as completed
        if self.commitment.status in ['active', 'under_review']:
            self.commitment.mark_completed(completed_by=verified_by, notes=notes)
        
        return self
    
    def reject(self, verified_by, notes=''):
        """Reject evidence and mark commitment as failed"""
        with transaction.atomic():
            if self.status in ['approved', 'rejected']:
                raise ValueError(f"Cannot reject verification with status: {self.status}")
        
        self.status = 'rejected'
        self.verified_by = verified_by
        self.notes = notes
        self.verified_at = timezone.now()
        self.save()
        
        # Mark commitment as failed
        if self.commitment.status in ['active', 'under_review']:
            self.commitment.mark_failed(
                reason=f'Evidence rejected by admin: {notes}',
                failed_by=verified_by
            )
        
        return self
    
    def request_more_info(self, verified_by, notes=''):
        """Request more information from user"""
        self.status = 'needs_more_info'
        self.verified_by = verified_by
        self.notes = notes
        self.verified_at = timezone.now()
        self.save()
        return self
    