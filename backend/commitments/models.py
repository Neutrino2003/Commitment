from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
from users.models import CustomUser
from decimal import Decimal
from dateutil.relativedelta import relativedelta


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
    
    # Primary data
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='commitments')
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
    
    stake_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    # NOTE: Corrected spelling of currency default value.
    currency = models.CharField(max_length=10, default='Rupees')
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
        
        # Create new instance
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
            status='active'
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
    
    def mark_completed(self, evidence_type=None, evidence_data=None):
        """Mark contract as completed with evidence"""
        if self.status in ['completed', 'failed', 'cancelled']:
            raise ValueError(f"Cannot mark {self.status} contract as completed")
        
        if self.evidence_required and not evidence_type:
            raise ValueError("Evidence type is required for this contract")
        
        # Validate not past deadline
        if timezone.now() > self.end_time:
            raise ValueError("Cannot mark completed after deadline")
        
        # Store evidence
        if evidence_type:
            self.evidence_type = evidence_type
        if evidence_data:
            self.evidence_file = evidence_data
        
        # Mark as completed
        self.status = 'completed'
        self.evidence_submitted = True
        self.evidence_submitted_at = timezone.now()
        self.completed_at = timezone.now()
        self.save()
        
        return self
    
    def mark_failed(self, reason=''):
        """Mark contract as failed"""
        if self.status in ['completed', 'failed', 'cancelled']:
            raise ValueError(f"Cannot mark {self.status} contract as failed")
        
        # Mark as failed
        self.status = 'failed'
        self.complaint = reason
        self.completed_at = timezone.now()
        self.save()
        
        return self
    
    def activate(self):
        """Activate a draft contract"""
        if self.status != 'draft':
            raise ValueError(f"Only draft contracts can be activated, this is {self.status}")
        
        self.status = 'active'
        self.activated_at = timezone.now()
        self.save()
        return self
    
    def pause(self):
        """Pause an active contract"""
        if self.status != 'active':
            raise ValueError(f"Only active contracts can be paused")
        
        self.status = 'paused'
        self.save()
        return self

    def resume(self):
        """Resume a paused contract"""
        if self.status != 'paused':
            raise ValueError(f"Only paused contracts can be resumed")
        
        self.status = 'active'
        self.save()
        return self
    
    def cancel(self):
        """Cancel a contract"""
        if self.status in ['completed', 'failed', 'cancelled']:
            raise ValueError(f"Cannot cancel a {self.status} contract")
        
        self.status = 'cancelled'
        self.save()
        return self
    
    def flag_complaint(self, complaint_text):
        """Flag a complaint on the contract"""
        self.complaints_flagged = True
        self.complaint = complaint_text
        self.save()
        return self
    
    # Complaint will be added here
    