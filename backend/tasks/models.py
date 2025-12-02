"""
Tasks App Models

This module defines the productivity domain models for task management.
Follows the TickTick-like architecture defined in database-schema.md.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class TaskList(models.Model):
    """
    Container for organizing tasks (e.g., 'Work', 'Personal', 'Groceries').
    Equivalent to 'Lists' or 'Projects' in productivity apps like TickTick.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_lists'
    )
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#FFFFFF', help_text='Hex color code')
    is_default = models.BooleanField(default=False, help_text='Default inbox list')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'name']
        indexes = [
            models.Index(fields=['user', 'is_default']),
        ]
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Tag(models.Model):
    """
    Flexible labels for cross-cutting concerns (e.g., #urgent, #home).
    Tags can be applied to multiple tasks and help with filtering.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags'
    )
    name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']

    def __str__(self):
        return f"#{self.name}"


class Task(models.Model):
    """
    The atomic unit of productivity.
    Can be a simple to-do or upgraded to a Commitment via the "boost" feature.
    """
    PRIORITY_CHOICES = [
        (0, 'None'),
        (1, 'Low'),
        (3, 'Medium'),
        (5, 'High'),
        (9, 'Critical'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    task_list = models.ForeignKey(
        TaskList,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='subtasks',
        help_text='Parent task for creating subtask hierarchy'
    )

    # Core fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Scheduling
    due_date = models.DateTimeField(null=True, blank=True)
    is_all_day = models.BooleanField(default=False)

    # Organization
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=0)
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')

    # Status
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_completed']),
            models.Index(fields=['user', 'due_date']),
            models.Index(fields=['task_list']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def complete(self):
        """Mark task as completed"""
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()

    def uncomplete(self):
        """Mark task as incomplete"""
        if self.is_completed:
            self.is_completed = False
            self.completed_at = None
            self.save()

    @property
    def has_commitment(self):
        """Check if this task has been boosted to a commitment"""
        return hasattr(self, 'commitment')

    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.due_date and not self.is_completed:
            return timezone.now() > self.due_date
        return False
