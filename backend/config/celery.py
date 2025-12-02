"""
Celery configuration for the commitment app.

This module initializes Celery for asynchronous task processing.
Tasks include:
- Sending notifications
- Processing refunds
- Checking overdue commitments
- Evidence verification reminders
"""

from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'auto-activate-commitments-every-15-minutes': {
        'task': 'commitments.tasks.auto_activate_commitments',
        'schedule': crontab(minute='*/15'),  # Run every 15 minutes
    },
    'check-overdue-commitments-every-hour': {
        'task': 'commitments.tasks.check_overdue_commitments',
        'schedule': crontab(minute=0),  # Run every hour
    },
    'auto-fail-overdue-commitments-daily': {
        'task': 'commitments.tasks.auto_fail_overdue_commitments',
        'schedule': crontab(hour=0, minute=0),  # Run daily at midnight
    },
    'send-deadline-reminders-daily': {
        'task': 'commitments.tasks.send_deadline_reminders',
        'schedule': crontab(hour=9, minute=0),  # Run daily at 9 AM
    },
    'process-pending-refunds-daily': {
        'task': 'commitments.tasks.process_pending_refunds',
        'schedule': crontab(hour=10, minute=0),  # Run daily at 10 AM
    },
    'send-evidence-verification-reminders-daily': {
        'task': 'commitments.tasks.send_evidence_verification_reminder',
        'schedule': crontab(hour=11, minute=0),  # Run daily at 11 AM
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to test Celery is working"""
    print(f'Request: {self.request!r}')
