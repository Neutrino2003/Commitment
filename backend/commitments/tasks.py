"""
Celery tasks for the commitments app.

This module contains asynchronous tasks for:
- Sending notifications to users
- Processing refunds
- Checking overdue commitments
- Sending deadline reminders
"""

from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

from .models import Complaint, Commitment
# ==============================================================================
# NOTIFICATION TASKS
# ==============================================================================

@shared_task(bind=True, max_retries=3)
def send_complaint_notification(self, complaint_id: int, notification_type: str):
    """
    Send notification to user about complaint status.
    
    Args:
        complaint_id: ID of the complaint
        notification_type: 'approved', 'rejected', or 'submitted'
    """
     
    try:
        complaint = Complaint.objects.select_related('user', 'commitment').get(id=complaint_id)
        user = complaint.user
        
        # Prepare email content based on notification type
        if notification_type == 'approved':
            subject = f'Complaint Approved - Refund of {complaint.refund_amount} {complaint.commitment.currency}'
            message = f"""
Dear {user.get_full_name() or user.username},

Your complaint regarding commitment "{complaint.commitment.title}" has been approved.

Refund Amount: {complaint.refund_amount} {complaint.commitment.currency}
Review Notes: {complaint.review_notes or 'N/A'}

The refund will be processed shortly and credited to your account.

Thank you for your patience.

Best regards,
Commitment App Team
            """
        
        elif notification_type == 'rejected':
            subject = f'Complaint Rejected - {complaint.commitment.title}'
            message = f"""
Dear {user.get_full_name() or user.username},

Your complaint regarding commitment "{complaint.commitment.title}" has been reviewed and unfortunately rejected.

Reason: {complaint.review_notes or 'Please contact support for more details.'}

If you have any questions, please contact our support team.

Best regards,
Commitment App Team
            """
        
        elif notification_type == 'submitted':
            subject = f'Complaint Submitted Successfully - {complaint.commitment.title}'
            message = f"""
Dear {user.get_full_name() or user.username},

Your complaint has been successfully submitted and is under review.

Commitment: {complaint.commitment.title}
Complaint ID: {complaint.id}
Reason: {complaint.get_reason_category_display()}

Our team will review your complaint and notify you of the decision within 2-3 business days.

Best regards,
Commitment App Team
            """
        else:
            logger.warning(f"Unknown notification type: {notification_type}")
            return
        
        # Send email
        if user.email:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"Notification sent to {user.email} for complaint #{complaint_id}")
        else:
            logger.warning(f"User {user.username} has no email address")
        
        return f"Notification sent successfully for complaint #{complaint_id}"
    
    except Complaint.DoesNotExist:
        logger.error(f"Complaint {complaint_id} not found")
        return f"Complaint {complaint_id} not found"
    
    except Exception as exc:
        logger.error(f"Error sending notification for complaint {complaint_id}: {str(exc)}")
        # Retry the task
        raise self.retry(exc=exc, countdown=60 * 5)  # Retry after 5 minutes


@shared_task(bind=True, max_retries=3)
def send_commitment_notification(self, commitment_id: int, notification_type: str):
    """
    Send notification to user about commitment status.
    
    Args:
        commitment_id: ID of the commitment
        notification_type: 'completed', 'failed', 'deadline_reminder', 'overdue'
    """

    try:
        commitment = Commitment.objects.select_related('user').get(id=commitment_id)
        user = commitment.user
        
        # Prepare email content
        if notification_type == 'completed':
            subject = f'Commitment Completed - {commitment.title}'
            message = f"""
Dear {user.get_full_name() or user.username},

Congratulations! You have successfully completed your commitment.

Commitment: {commitment.title}
Stake Amount: {commitment.stake_amount} {commitment.currency}
Completed On: {commitment.completed_at.strftime('%Y-%m-%d %H:%M') if commitment.completed_at else 'N/A'}

Keep up the great work!

Best regards,
Commitment App Team
            """
        
        elif notification_type == 'failed':
            subject = f'Commitment Failed - {commitment.title}'
            message = f"""
Dear {user.get_full_name() or user.username},

Unfortunately, your commitment has been marked as failed.

Commitment: {commitment.title}
Stake Amount Lost: {commitment.stake_amount} {commitment.currency}

If you believe this was an error, you can file a complaint through the app within 48 hours.

Best regards,
Commitment App Team
            """
        
        elif notification_type == 'deadline_reminder':
            time_remaining = commitment.time_remaining
            hours_remaining = int(time_remaining.total_seconds() / 3600) if time_remaining else 0
            
            subject = f'Deadline Reminder - {commitment.title}'
            message = f"""
Dear {user.get_full_name() or user.username},

This is a reminder that your commitment deadline is approaching.

Commitment: {commitment.title}
Deadline: {commitment.end_time.strftime('%Y-%m-%d %H:%M')}
Time Remaining: {hours_remaining} hours
Stake Amount: {commitment.stake_amount} {commitment.currency}

Please submit your evidence before the deadline to avoid losing your stake.

Best regards,
Commitment App Team
            """
        
        elif notification_type == 'overdue':
            subject = f'Commitment Overdue - {commitment.title}'
            message = f"""
Dear {user.get_full_name() or user.username},

Your commitment has passed its deadline and is now overdue.

Commitment: {commitment.title}
Deadline: {commitment.end_time.strftime('%Y-%m-%d %H:%M')}
Stake Amount at Risk: {commitment.stake_amount} {commitment.currency}

If you have not submitted evidence, your commitment may be marked as failed. If this was due to unforeseen circumstances, you can file a complaint.

Best regards,
Commitment App Team
            """
        else:
            logger.warning(f"Unknown notification type: {notification_type}")
            return
        
        # Send email
        if user.email:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"Notification sent to {user.email} for commitment #{commitment_id}")
        else:
            logger.warning(f"User {user.username} has no email address")
        
        return f"Notification sent successfully for commitment #{commitment_id}"
    
    except Commitment.DoesNotExist:
        logger.error(f"Commitment {commitment_id} not found")
        return f"Commitment {commitment_id} not found"
    
    except Exception as exc:
        logger.error(f"Error sending notification for commitment {commitment_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * 5)


# ==============================================================================
# PERIODIC TASKS
# ==============================================================================

@shared_task
def auto_activate_commitments():
    """
    Automatically activate draft commitments when their start_time arrives.
    Runs every 15 minutes via Celery Beat.
    """
    
    now = timezone.now()
    
    # Find draft commitments whose start_time has arrived and end_time hasn't passed
    commitments_to_activate = Commitment.objects.filter(
        status='draft',
        start_time__lte=now,
        end_time__gt=now
    )
    
    logger.info(f"Found {commitments_to_activate.count()} commitments to auto-activate")
    
    activated_count = 0
    for commitment in commitments_to_activate:
        try:
            commitment.activate()
            activated_count += 1
            logger.info(f"Auto-activated commitment #{commitment.id}: {commitment.title}")
        except Exception as e:
            logger.error(f"Error auto-activating commitment #{commitment.id}: {str(e)}")
    
    return f"Auto-activated {activated_count} commitments"


@shared_task
def check_overdue_commitments():
    """
    Check for overdue commitments and send notifications.
    Runs hourly via Celery Beat.
    """
    
    now = timezone.now()
    
    # Find active commitments that are overdue
    overdue_commitments = Commitment.objects.filter(
        status='active',
        end_time__lt=now
    )
    
    logger.info(f"Found {overdue_commitments.count()} overdue commitments")
    
    for commitment in overdue_commitments:
        # Send overdue notification
        send_commitment_notification.delay(commitment.id, 'overdue')
    
    return f"Processed {overdue_commitments.count()} overdue commitments"


@shared_task
def auto_fail_overdue_commitments():
    """
    Automatically mark overdue commitments as failed if no evidence submitted.
    Runs daily at midnight via Celery Beat.
    
    Grace period: 24 hours after deadline before auto-failing.
    """
    
    now = timezone.now()
    grace_period_end = now - timedelta(hours=24)
    
    # Find active commitments that are overdue beyond grace period with no evidence
    overdue_commitments = Commitment.objects.filter(
        status='active',
        end_time__lt=grace_period_end,
        evidence_submitted=False
    )
    
    logger.info(f"Found {overdue_commitments.count()} commitments to auto-fail")
    
    failed_count = 0
    for commitment in overdue_commitments:
        try:
            # Use the model's auto_fail method
            if commitment.auto_fail_if_overdue():
                failed_count += 1
                
                # Send failure notification
                send_commitment_notification.delay(commitment.id, 'failed')
                
                # Create next recurring instance if applicable
                if commitment.frequency != 'one_time':
                    next_instance = commitment.create_next_instance()
                    if next_instance:
                        logger.info(f"Created next instance #{next_instance.id} for commitment #{commitment.id}")
                
                logger.info(f"Auto-failed commitment #{commitment.id}")
        
        except Exception as e:
            logger.error(f"Error auto-failing commitment #{commitment.id}: {str(e)}")
    
    return f"Auto-failed {failed_count} commitments"


@shared_task
def send_deadline_reminders():
    """
    Send deadline reminders for commitments due within 24 hours.
    Runs daily at 9 AM via Celery Beat.
    """
    
    now = timezone.now()
    tomorrow = now + timedelta(hours=24)
    
    # Find active commitments with deadline within 24 hours
    upcoming_deadlines = Commitment.objects.filter(
        status='active',
        end_time__gte=now,
        end_time__lte=tomorrow,
        evidence_submitted=False
    )
    
    logger.info(f"Found {upcoming_deadlines.count()} commitments with upcoming deadlines")
    
    for commitment in upcoming_deadlines:
        send_commitment_notification.delay(commitment.id, 'deadline_reminder')
    
    return f"Sent {upcoming_deadlines.count()} deadline reminders"


@shared_task
def process_pending_refunds():
    """
    Process approved complaints with pending refunds.
    Runs daily at 10 AM via Celery Beat.
    
    Note: This is a placeholder. In production, integrate with payment gateway.
    """
     
    
    pending_refunds = Complaint.objects.filter(
        status='approved',
        refund_processed=False
    )
    
    logger.info(f"Found {pending_refunds.count()} pending refunds to process")
    
    processed_count = 0
    for complaint in pending_refunds:
        try:
            # TODO: Integrate with payment gateway to process actual refund
            # For now, just mark as processed
            complaint.process_refund()
            processed_count += 1
            
            # Send notification
            send_complaint_notification.delay(complaint.id, 'refund_processed')
            
            logger.info(f"Processed refund for complaint #{complaint.id}")
        
        except Exception as e:
            logger.error(f"Error processing refund for complaint #{complaint.id}: {str(e)}")
    
    return f"Processed {processed_count} refunds"


# ==============================================================================
# EVIDENCE VERIFICATION TASKS
# ==============================================================================

@shared_task(bind=True, max_retries=3)
def verify_evidence_automatic(self, commitment_id: int):
    """
    Automatically verify evidence for self-verification type commitments.
    
    Args:
        commitment_id: ID of the commitment to verify
    """
    
    try:
        commitment = Commitment.objects.get(id=commitment_id)
        
        # Only auto-verify self-verification type
        if commitment.evidence_type == 'self_verification':
            if commitment.evidence_submitted and commitment.status == 'active':
                # Mark as completed
                commitment.status = 'completed'
                commitment.completed_at = timezone.now()
                commitment.save()
                
                # Send completion notification
                send_commitment_notification.delay(commitment.id, 'completed')
                
                logger.info(f"Auto-verified evidence for commitment #{commitment_id}")
                return f"Evidence auto-verified for commitment #{commitment_id}"
        else:
            logger.info(f"Commitment #{commitment_id} requires manual verification")
            return f"Manual verification required for commitment #{commitment_id}"
    
    except Commitment.DoesNotExist:
        logger.error(f"Commitment {commitment_id} not found")
        return f"Commitment {commitment_id} not found"
    
    except Exception as exc:
        logger.error(f"Error verifying evidence for commitment {commitment_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * 5)


@shared_task
def send_evidence_verification_reminder():
    """
    Send reminder to admin about pending evidence verifications.
    Runs daily.
    """
    
    pending_verification = Commitment.objects.filter(
        status='active',
        evidence_submitted=True,
        evidence_type__in=['photo', 'timelapse_video', 'manual']
    ).count()
    
    if pending_verification > 0:
        # Send email to admin
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admin_users = User.objects.filter(is_staff=True, is_active=True)
            admin_emails = [user.email for user in admin_users if user.email]
            
            if admin_emails:
                send_mail(
                    subject=f'Evidence Verification Reminder - {pending_verification} Pending',
                    message=f"""
Dear Admin,

There are {pending_verification} commitments with pending evidence verification.

Please log in to the admin panel to review and verify the submitted evidence.

Best regards,
Commitment App System
                    """,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=False,
                )
                logger.info(f"Sent verification reminder to {len(admin_emails)} admins")
        
        except Exception as e:
            logger.error(f"Error sending verification reminder: {str(e)}")
    
    return f"Pending verifications: {pending_verification}"
