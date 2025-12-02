"""
Service Layer for Commitments App

This module contains business logic for commitments, complaints, and evidence verification.
Services handle complex workflows that involve multiple models, external services, or side effects.

Service Layer Benefits:
1. Separates business logic from views (views become thin controllers)
2. Reusable logic across different entry points (API, CLI, admin actions)
3. Easier to test (no HTTP request/response overhead)
4. Transaction management in one place
5. Clear separation of concerns

When to use Services:
- Operations involving multiple models
- Complex state transitions
- External API calls (payments, notifications)
- Operations that require transactions
- Logic reused across multiple views
"""

from django.db import transaction
from django.utils import timezone
from typing import Tuple, Optional
import logging

from .models import Commitment, Complaint, EvidenceVerification
from users.models import UserStatistics

logger = logging.getLogger(__name__)


# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def send_notification_with_fallback(task_func, *args, **kwargs):
    """
    Send notification via Celery if available, otherwise send synchronously.
    
    This allows the app to work in development without Redis/Celery running.
    """
    try:
        # Try async with Celery
        task_func.delay(*args, **kwargs)
    except Exception as e:
        # Fallback to synchronous execution if Celery/Redis not available
        logger.warning(f"Celery not available, sending notification synchronously: {e}")
        try:
            task_func(*args, **kwargs)
        except Exception as sync_error:
            logger.error(f"Failed to send notification: {sync_error}")


# ==============================================================================
# COMMITMENT SERVICES
# ==============================================================================

class CommitmentService:
    """
    Service for handling commitment lifecycle operations.
    
    Responsibilities:
    - Commitment completion (with evidence)
    - Commitment failure
    - Auto-activation
    - Recurring instance creation
    """
    
    @staticmethod
    @transaction.atomic
    def complete_commitment(
        commitment: Commitment,
        completed_by,
        evidence_type: Optional[str] = None,
        evidence_file=None,
        evidence_text: str = ''
    ) -> Tuple[Commitment, Optional[Commitment]]:
        """
        Complete a commitment with optional evidence.
        
        For self-verification: Marks as completed immediately
        For photo/video/manual: Submits evidence for admin review
        
        Args:
            commitment: The commitment to complete
            completed_by: User completing the commitment
            evidence_type: Type of evidence being submitted
            evidence_file: File evidence (if any)
            evidence_text: Text description/notes
            
        Returns:
            Tuple of (updated_commitment, next_recurring_instance or None)
            
        Raises:
            ValueError: If commitment is in invalid state for completion
        """
        if commitment.status not in ['active', 'paused']:
            raise ValueError(f"Cannot complete {commitment.status} commitment")
        
        # Self-verification flow: immediate completion
        if commitment.evidence_type == 'self_verification':
            return CommitmentService._complete_self_verified(
                commitment, completed_by, evidence_text
            )
        
        # Manual verification flow: submit for review
        else:
            return CommitmentService._submit_for_verification(
                commitment, completed_by, evidence_type, evidence_file, evidence_text
            )
    
    @staticmethod
    def _complete_self_verified(
        commitment: Commitment,
        completed_by,
        evidence_text: str
    ) -> Tuple[Commitment, Optional[Commitment]]:
        """Handle completion for self-verified commitments."""
        
        # Save optional evidence
        if evidence_text:
            commitment.evidence_text = evidence_text
            commitment.evidence_submitted = True
            commitment.evidence_submitted_at = timezone.now()
        
        # Mark as completed
        commitment.mark_completed(completed_by=completed_by, notes=evidence_text)
        
        # Update user statistics
        CommitmentService._update_user_stats_on_completion(commitment.user)
        
        # Send notification asynchronously
        from .tasks import send_commitment_notification
        send_notification_with_fallback(send_commitment_notification, commitment.id, 'completed')
        
        # Create next recurring instance
        next_instance = None
        if commitment.frequency != 'one_time':
            next_instance = commitment.create_next_instance()
            logger.info(f"Created recurring instance {next_instance.id} for commitment {commitment.id}")
        
        return commitment, next_instance
    
    @staticmethod
    def _submit_for_verification(
        commitment: Commitment,
        completed_by,
        evidence_type: str,
        evidence_file,
        evidence_text: str
    ) -> Tuple[Commitment, None]:
        """Submit evidence for admin verification."""
        
        # Submit evidence to commitment
        commitment.submit_evidence(
            evidence_type=evidence_type,
            evidence_data=evidence_file,
            evidence_text=evidence_text
        )
        
        # Create or update verification record
        verification, created = EvidenceVerification.objects.get_or_create(
            commitment=commitment,
            defaults={'status': 'pending'}
        )
        
        if not created:
            # Reset to pending if evidence was resubmitted
            verification.status = 'pending'
            verification.verified_by = None
            verification.verified_at = None
            verification.save()
        
        # Send notification
        from .tasks import send_commitment_notification
        send_notification_with_fallback(send_commitment_notification, commitment.id, 'evidence_submitted')
        
        logger.info(f"Evidence submitted for commitment {commitment.id}, awaiting verification")
        
        # No next instance until verification is complete
        return commitment, None
    
    @staticmethod
    @transaction.atomic
    def mark_commitment_failed(
        commitment: Commitment,
        failed_by,
        reason: str = ''
    ) -> Tuple[Commitment, Optional[Commitment]]:
        """
        Mark a commitment as failed.
        
        This is called when:
        - User manually marks as failed
        - Auto-fail due to deadline
        - Admin rejects evidence
        
        Args:
            commitment: The commitment to fail
            failed_by: User/system marking as failed
            reason: Reason for failure
            
        Returns:
            Tuple of (failed_commitment, next_recurring_instance or None)
        """
        if commitment.status in ['completed', 'cancelled']:
            raise ValueError(f"Cannot mark {commitment.status} commitment as failed")
        
        # Mark as failed
        commitment.mark_failed(reason=reason, failed_by=failed_by)
        
        # Update user statistics
        CommitmentService._update_user_stats_on_failure(commitment.user, commitment.stake_amount)
        
        # Send notification
        from .tasks import send_commitment_notification
        send_notification_with_fallback(send_commitment_notification, commitment.id, 'failed')
        
        # Create next recurring instance
        next_instance = None
        if commitment.frequency != 'one_time':
            next_instance = commitment.create_next_instance()
            logger.info(f"Created recurring instance {next_instance.id} after failure of {commitment.id}")
        
        logger.info(f"Commitment {commitment.id} marked as failed: {reason}")
        
        return commitment, next_instance
    
    @staticmethod
    def _update_user_stats_on_completion(user):
        """Update user statistics when commitment is completed."""
        stats, created = UserStatistics.objects.get_or_create(user=user)
        stats.successful_contracts += 1
        stats.total_contracts += 1
        stats.save()
        logger.info(f"Updated stats for user {user.id}: +1 successful contract")
    
    @staticmethod
    def _update_user_stats_on_failure(user, stake_amount):
        """Update user statistics when commitment fails."""
        stats, created = UserStatistics.objects.get_or_create(user=user)
        stats.failed_contracts += 1
        stats.total_contracts += 1
        stats.total_loss += stake_amount
        stats.save()
        logger.info(f"Updated stats for user {user.id}: +1 failed contract, loss: {stake_amount}")


# ==============================================================================
# COMPLAINT SERVICES
# ==============================================================================

class ComplaintService:
    """
    Service for handling complaint workflows.
    
    Responsibilities:
    - Creating complaints
    - Approving/rejecting complaints
    - Processing refunds
    - Updating statistics
    """
    
    @staticmethod
    @transaction.atomic
    def create_complaint(
        user,
        commitment: Commitment,
        reason_category: str,
        description: str,
        evidence_file=None
    ) -> Complaint:
        """
        Create a new complaint for a failed commitment.
        
        Args:
            user: User filing the complaint
            commitment: The commitment being complained about
            reason_category: Category of complaint
            description: Detailed explanation
            evidence_file: Supporting evidence file
            
        Returns:
            Created Complaint instance
            
        Raises:
            ValueError: If complaint cannot be filed (e.g., commitment not failed)
        """
        if commitment.status not in ['failed']:
            raise ValueError("Complaints can only be filed for failed commitments")
        
        # Create complaint
        complaint = Complaint.objects.create(
            user=user,
            commitment=commitment,
            reason_category=reason_category,
            description=description,
            evidence_file=evidence_file
        )
        
        # Update user statistics
        stats, _ = UserStatistics.objects.get_or_create(user=user)
        stats.complaints_applied += 1
        stats.save()
        
        # Send notification
        from .tasks import send_complaint_notification
        send_notification_with_fallback(send_complaint_notification, complaint.id, 'submitted')
        
        logger.info(f"Complaint {complaint.id} created by user {user.id} for commitment {commitment.id}")
        
        return complaint
    
    @staticmethod
    @transaction.atomic
    def approve_complaint(
        complaint: Complaint,
        reviewed_by,
        review_notes: str = '',
        refund_amount=None
    ) -> Complaint:
        """
        Approve a complaint and grant refund.
        
        Args:
            complaint: The complaint to approve
            reviewed_by: Admin approving the complaint
            review_notes: Notes from the reviewer
            refund_amount: Amount to refund (defaults to full stake)
            
        Returns:
            Updated Complaint instance
        """
        if complaint.status in ['approved', 'rejected']:
            raise ValueError(f"Cannot approve complaint with status: {complaint.status}")
        
        # Approve the complaint (updates complaint and commitment status)
        complaint.approve(
            reviewed_by=reviewed_by,
            review_notes=review_notes,
            refund_amount=refund_amount
        )
        
        # Update user statistics
        stats, _ = UserStatistics.objects.get_or_create(user=complaint.user)
        stats.complaints_approved += 1
        stats.save()
        
        # Send notification
        from .tasks import send_complaint_notification
        send_notification_with_fallback(send_complaint_notification, complaint.id, 'approved')
        
        logger.info(
            f"Complaint {complaint.id} approved by {reviewed_by.id}. "
            f"Refund: {complaint.refund_amount} {complaint.commitment.currency}"
        )
        
        return complaint
    
    @staticmethod
    @transaction.atomic
    def reject_complaint(
        complaint: Complaint,
        reviewed_by,
        review_notes: str = ''
    ) -> Complaint:
        """
        Reject a complaint.
        
        Args:
            complaint: The complaint to reject
            reviewed_by: Admin rejecting the complaint
            review_notes: Reason for rejection
            
        Returns:
            Updated Complaint instance
        """
        if complaint.status in ['approved', 'rejected']:
            raise ValueError(f"Cannot reject complaint with status: {complaint.status}")
        
        # Reject the complaint
        complaint.reject(
            reviewed_by=reviewed_by,
            review_notes=review_notes
        )
        
        # Update user statistics
        stats, _ = UserStatistics.objects.get_or_create(user=complaint.user)
        stats.complaints_rejected += 1
        stats.save()
        
        # Send notification
        from .tasks import send_complaint_notification
        send_notification_with_fallback(send_complaint_notification, complaint.id, 'rejected')
        
        logger.info(f"Complaint {complaint.id} rejected by {reviewed_by.id}: {review_notes}")
        
        return complaint


# ==============================================================================
# EVIDENCE VERIFICATION SERVICES
# ==============================================================================

class EvidenceVerificationService:
    """
    Service for handling evidence verification by admins.
    
    Responsibilities:
    - Approving evidence
    - Rejecting evidence
    - Requesting more information
    """
    
    @staticmethod
    @transaction.atomic
    def approve_evidence(
        verification: EvidenceVerification,
        verified_by,
        notes: str = ''
    ) -> EvidenceVerification:
        """
        Approve submitted evidence and complete the commitment.
        
        Args:
            verification: The verification record
            verified_by: Admin approving the evidence
            notes: Notes about the verification
            
        Returns:
            Updated EvidenceVerification instance
        """
        if not verification.is_pending:
            raise ValueError(f"Cannot approve verification with status: {verification.status}")
        
        # Approve the verification (this also marks commitment as completed)
        verification.approve(verified_by=verified_by, notes=notes)
        
        # Update user statistics
        CommitmentService._update_user_stats_on_completion(verification.commitment.user)
        
        # Create next recurring instance if applicable
        next_instance = None
        if verification.commitment.frequency != 'one_time':
            next_instance = verification.commitment.create_next_instance()
            if next_instance:
                logger.info(
                    f"Created recurring instance {next_instance.id} "
                    f"after evidence approval for {verification.commitment.id}"
                )
        
        # Send notification
        from .tasks import send_commitment_notification
        send_notification_with_fallback(send_commitment_notification, verification.commitment.id, 'completed')
        
        logger.info(
            f"Evidence approved for commitment {verification.commitment.id} "
            f"by {verified_by.id}"
        )
        
        return verification
    
    @staticmethod
    @transaction.atomic
    def reject_evidence(
        verification: EvidenceVerification,
        verified_by,
        notes: str = ''
    ) -> EvidenceVerification:
        """
        Reject submitted evidence and mark commitment as failed.
        
        Args:
            verification: The verification record
            verified_by: Admin rejecting the evidence
            notes: Reason for rejection
            
        Returns:
            Updated EvidenceVerification instance
        """
        if not verification.is_pending:
            raise ValueError(f"Cannot reject verification with status: {verification.status}")
        
        # Reject the verification (this also marks commitment as failed)
        verification.reject(verified_by=verified_by, notes=notes)
        
        # Update user statistics
        CommitmentService._update_user_stats_on_failure(
            verification.commitment.user,
            verification.commitment.stake_amount
        )
        
        # Create next recurring instance
        next_instance = None
        if verification.commitment.frequency != 'one_time':
            next_instance = verification.commitment.create_next_instance()
            if next_instance:
                logger.info(
                    f"Created recurring instance {next_instance.id} "
                    f"after evidence rejection for {verification.commitment.id}"
                )
        
        # Send notification
        from .tasks import send_commitment_notification
        send_notification_with_fallback(send_commitment_notification, verification.commitment.id, 'failed')
        
        logger.info(
            f"Evidence rejected for commitment {verification.commitment.id} "
            f"by {verified_by.id}: {notes}"
        )
        
        return verification
    
    @staticmethod
    def request_more_info(
        verification: EvidenceVerification,
        verified_by,
        notes: str
    ) -> EvidenceVerification:
        """
        Request additional information from the user.
        
        Args:
            verification: The verification record
            verified_by: Admin requesting more info
            notes: What additional information is needed
            
        Returns:
            Updated EvidenceVerification instance
        """
        verification.request_more_info(verified_by=verified_by, notes=notes)
        
        # TODO: Send notification to user requesting more info
        logger.info(
            f"More info requested for commitment {verification.commitment.id} "
            f"by {verified_by.id}"
        )
        
        return verification
