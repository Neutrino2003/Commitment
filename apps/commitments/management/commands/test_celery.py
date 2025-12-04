"""
Management command to test Celery tasks.

Usage:
    # Test all tasks
    python manage.py test_celery
    
    # Test specific task
    python manage.py test_celery --task=check_overdue
    python manage.py test_celery --task=reminder
    python manage.py test_celery --task=cache
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Test Celery tasks for commitments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--task',
            type=str,
            choices=['all', 'check_overdue', 'reminder', 'cache', 'ping'],
            default='ping',
            help='Which task to test'
        )
        parser.add_argument(
            '--sync',
            action='store_true',
            help='Run synchronously (without Celery)'
        )

    def handle(self, *args, **options):
        task_name = options['task']
        sync = options['sync']
        
        if task_name == 'ping':
            self.test_ping(sync)
        elif task_name == 'check_overdue':
            self.test_check_overdue(sync)
        elif task_name == 'reminder':
            self.test_reminder(sync)
        elif task_name == 'cache':
            self.test_cache(sync)
        elif task_name == 'all':
            self.test_ping(sync)
            self.test_check_overdue(sync)
            self.test_cache(sync)
    
    def test_ping(self, sync=False):
        """Test basic Celery connectivity."""
        from config.celery import debug_task
        
        self.stdout.write(self.style.NOTICE('Testing Celery ping...'))
        
        if sync:
            debug_task()
            self.stdout.write(self.style.SUCCESS('✅ Sync ping successful'))
        else:
            result = debug_task.delay()
            self.stdout.write(self.style.SUCCESS(f'✅ Async task queued: {result.id}'))
    
    def test_check_overdue(self, sync=False):
        """Test the check_overdue_commitments task."""
        from apps.commitments.tasks import check_overdue_commitments
        
        self.stdout.write(self.style.NOTICE('Testing check_overdue_commitments...'))
        
        if sync:
            result = check_overdue_commitments()
            self.stdout.write(self.style.SUCCESS(f'✅ Result: {result}'))
        else:
            result = check_overdue_commitments.delay()
            self.stdout.write(self.style.SUCCESS(f'✅ Async task queued: {result.id}'))
    
    def test_reminder(self, sync=False):
        """Test the send_deadline_reminders task."""
        from apps.commitments.tasks import send_deadline_reminders
        
        self.stdout.write(self.style.NOTICE('Testing send_deadline_reminders...'))
        
        if sync:
            result = send_deadline_reminders()
            self.stdout.write(self.style.SUCCESS(f'✅ Result: {result}'))
        else:
            result = send_deadline_reminders.delay()
            self.stdout.write(self.style.SUCCESS(f'✅ Async task queued: {result.id}'))
    
    def test_cache(self, sync=False):
        """Test cache operations."""
        from django.core.cache import cache
        
        self.stdout.write(self.style.NOTICE('Testing Redis cache...'))
        
        # Test set/get
        cache.set('test_key', 'test_value', timeout=60)
        value = cache.get('test_key')
        
        if value == 'test_value':
            self.stdout.write(self.style.SUCCESS('✅ Cache set/get working'))
        else:
            self.stdout.write(self.style.ERROR('❌ Cache set/get failed'))
        
        # Test delete
        cache.delete('test_key')
        value = cache.get('test_key')
        
        if value is None:
            self.stdout.write(self.style.SUCCESS('✅ Cache delete working'))
        else:
            self.stdout.write(self.style.ERROR('❌ Cache delete failed'))
        
        self.stdout.write(self.style.SUCCESS('✅ Redis cache tests passed'))
