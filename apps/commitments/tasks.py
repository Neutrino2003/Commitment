"""
Celery Tasks for Commitments App.

This module contains async and scheduled tasks for:
- Auto-failing overdue commitments
- Sending deadline reminders
- Processing evidence files
- Sending status notifications

Usage:
    # Call async task
    from apps.commitments.tasks import send_commitment_reminder
    send_commitment_reminder.delay(commitment_id=1)
    
    # Scheduled tasks run automatically via Celery Beat
"""

import logging
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from django.core.cache import cache

logger = logging.getLogger(__name__)


# =============================================================================
# SCHEDULED TASKS (Celery Beat)
# =============================================================================

@shared_task(bind=True, max_retries=3)
def check_overdue_commitments(self):
    """
    Check and auto-fail overdue commitments.
    Runs every hour via Celery Beat.
    
    Business Logic:
    - Find active commitments where task.due_date < now
    - Mark them as failed with reason "Deadline passed"
    - Skip commitments with leniency='lenient' (grace period logic could be added)
    """
    from .models import Commitment
    
    now = timezone.now()
    
    # Find overdue active commitments
    overdue_commitments = Commitment.objects.filter(
        status='active',
        task__due_date__lt=now
    ).select_related('task', 'task__user')
    
    failed_count = 0
    
    for commitment in overdue_commitments:
        try:
            commitment.mark_failed(reason='Deadline passed - auto-failed by system')
            failed_count += 1
            logger.info(f"Auto-failed commitment {commitment.id}: {commitment.title}")
            
            # Queue notification task
            send_status_notification.delay(
                commitment_id=commitment.id,
                new_status='failed',
                message='Your commitment has been automatically marked as failed because the deadline passed.'
            )
            
        except Exception as e:
            logger.error(f"Failed to auto-fail commitment {commitment.id}: {e}")
            continue
    
    # Invalidate dashboard cache for affected users
    if failed_count > 0:
        invalidate_dashboard_cache.delay()
    
    return f"Checked {overdue_commitments.count()} overdue commitments, failed {failed_count}"


@shared_task(bind=True, max_retries=3)
def send_deadline_reminders(self):
    """
    Send reminders for commitments due soon.
    Runs every 15 minutes via Celery Beat.
    
    Reminder Logic:
    - 1 hour before deadline: First reminder
    - 15 minutes before deadline: Final warning
    """
    from .models import Commitment
    
    now = timezone.now()
    
    # Commitments due in next hour (that haven't been reminded)
    one_hour_from_now = now + timedelta(hours=1)
    fifteen_minutes_from_now = now + timedelta(minutes=15)
    
    # Find commitments due within an hour
    upcoming_commitments = Commitment.objects.filter(
        status='active',
        evidence_submitted=False,
        task__due_date__gt=now,
        task__due_date__lte=one_hour_from_now
    ).select_related('task', 'task__user')
    
    reminder_count = 0
    
    for commitment in upcoming_commitments:
        # Check if we've already sent a reminder recently
        cache_key = f"reminder_sent_{commitment.id}"
        if cache.get(cache_key):
            continue
        
        try:
            # Determine urgency
            time_left = commitment.task.due_date - now
            is_final_warning = time_left <= timedelta(minutes=20)
            
            send_commitment_reminder.delay(
                commitment_id=commitment.id,
                is_final_warning=is_final_warning
            )
            
            # Mark as reminded (cache for 30 minutes to avoid spam)
            cache.set(cache_key, True, timeout=30 * 60)
            reminder_count += 1
            
        except Exception as e:
            logger.error(f"Failed to send reminder for commitment {commitment.id}: {e}")
            continue
    
    return f"Sent {reminder_count} reminders"


# =============================================================================
# ON-DEMAND ASYNC TASKS
# =============================================================================

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_commitment_reminder(self, commitment_id: int, is_final_warning: bool = False):
    """
    Send a deadline reminder to the user.
    
    Args:
        commitment_id: ID of the commitment
        is_final_warning: True if this is the final warning (< 20 min left)
    """
    from .models import Commitment
    
    try:
        commitment = Commitment.objects.select_related('task', 'task__user').get(id=commitment_id)
    except Commitment.DoesNotExist:
        logger.warning(f"Commitment {commitment_id} not found for reminder")
        return
    
    user = commitment.task.user
    time_left = commitment.task.due_date - timezone.now()
    
    # Format time remaining
    if time_left.seconds < 3600:
        time_str = f"{time_left.seconds // 60} minutes"
    else:
        time_str = f"{time_left.seconds // 3600} hours"
    
    subject = f"⏰ {'FINAL WARNING: ' if is_final_warning else ''}{time_str} left for: {commitment.title}"
    
    message = f"""
Hi {user.first_name or user.username},

{'🚨 FINAL WARNING! ' if is_final_warning else ''}You have {time_str} left to complete your commitment:

📝 Task: {commitment.title}
💰 Stake: {commitment.stake_amount} {commitment.currency if commitment.stake_type == 'money' else commitment.stake_type}
📅 Deadline: {commitment.task.due_date.strftime('%Y-%m-%d %H:%M')}

Don't forget to submit your evidence before the deadline!

-- TickTick Clone Team
    """.strip()
    
    # Log instead of sending for now (implement actual email later)
    logger.info(f"Reminder for {user.email}: {subject}")
    
    # Uncomment when email is configured:
    # send_mail(
    #     subject=subject,
    #     message=message,
    #     from_email=settings.DEFAULT_FROM_EMAIL,
    #     recipient_list=[user.email],
    #     fail_silently=False,
    # )
    
    return f"Sent reminder for commitment {commitment_id}"


@shared_task(bind=True, max_retries=3)
def send_status_notification(self, commitment_id: int, new_status: str, message: str = ''):
    """
    Send notification when commitment status changes.
    
    Args:
        commitment_id: ID of the commitment
        new_status: New status (completed, failed, etc.)
        message: Optional message to include
    """
    from .models import Commitment
    
    try:
        commitment = Commitment.objects.select_related('task', 'task__user').get(id=commitment_id)
    except Commitment.DoesNotExist:
        return
    
    user = commitment.task.user
    
    status_emoji = {
        'completed': '✅',
        'failed': '❌',
        'active': '🚀',
        'paused': '⏸️',
        'cancelled': '🚫',
    }.get(new_status, '📌')
    
    subject = f"{status_emoji} Commitment {new_status}: {commitment.title}"
    
    logger.info(f"Status notification for {user.email}: {subject}")
    
    return f"Sent status notification for commitment {commitment_id}"


@shared_task(bind=True, max_retries=3)
def process_evidence_file(self, commitment_id: int):
    """
    Process uploaded evidence file (compress, generate thumbnail, etc.)
    
    This task handles:
    - Video compression for timelapse evidence
    - Image optimization
    - Thumbnail generation
    """
    from .models import Commitment
    
    try:
        commitment = Commitment.objects.get(id=commitment_id)
    except Commitment.DoesNotExist:
        return
    
    if not commitment.evidence_file:
        return "No evidence file to process"
    
    file_path = commitment.evidence_file.path
    
    # TODO: Implement actual file processing
    # - For images: Resize, compress, generate thumbnail
    # - For videos: Compress, extract frame for thumbnail
    
    logger.info(f"Processing evidence file for commitment {commitment_id}: {file_path}")
    
    return f"Processed evidence for commitment {commitment_id}"


# =============================================================================
# CACHE MANAGEMENT TASKS
# =============================================================================

@shared_task
def invalidate_dashboard_cache():
    """
    Invalidate cached dashboard stats after bulk operations.
    """
    # Get all keys matching dashboard pattern
    cache.delete_pattern('ticktick:commitment_dashboard_*')
    logger.info("Invalidated dashboard cache")
    return "Cache invalidated"


@shared_task
def warm_dashboard_cache(user_id: int):
    """
    Pre-compute and cache dashboard stats for a user.
    Called after significant changes to speed up next dashboard load.
    """
    from .models import Commitment
    from django.db.models import Sum, Count
    from decimal import Decimal
    
    cache_key = f"commitment_dashboard_{user_id}"
    
    queryset = Commitment.objects.filter(task__user_id=user_id)
    
    active_count = queryset.filter(status='active').count()
    completed_count = queryset.filter(status='completed').count()
    failed_count = queryset.filter(status='failed').count()
    
    stakes_at_risk = queryset.filter(
        status='active',
        stake_type='money'
    ).aggregate(total=Sum('stake_amount'))['total'] or Decimal('0.00')
    
    total_resolved = completed_count + failed_count
    success_rate = (completed_count / total_resolved * 100) if total_resolved > 0 else 0
    
    stats = {
        'active_count': active_count,
        'completed_count': completed_count,
        'failed_count': failed_count,
        'total_stakes_at_risk': str(stakes_at_risk),
        'success_rate': round(success_rate, 1)
    }
    
    cache.set(cache_key, stats, timeout=300)  # 5 minutes
    logger.info(f"Warmed dashboard cache for user {user_id}")
    
    return stats
