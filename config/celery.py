"""
Celery Configuration for TickTick Clone.

This module configures Celery with Redis as broker for:
- Async task processing (evidence uploads, notifications)
- Scheduled tasks via Celery Beat (auto-fail overdue commitments)

Usage:
    # Start worker
    celery -A config worker -l INFO
    
    # Start beat scheduler (for periodic tasks)
    celery -A config beat -l INFO
    
    # Start both (development only)
    celery -A config worker -B -l INFO
"""

import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create Celery app
app = Celery('ticktick_clone')

# Load config from Django settings (namespace='CELERY' means all Celery
# settings should be prefixed with CELERY_ in settings.py)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task for testing Celery is working."""
    print(f'Request: {self.request!r}')
