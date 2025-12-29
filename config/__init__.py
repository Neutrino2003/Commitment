"""
TickTick Clone config package.
Load Celery app when Django starts.
"""

# Import Celery app for Django autodiscovery
from .celery import app as celery_app

__all__ = ('celery_app',)
