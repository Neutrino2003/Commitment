"""
Task Management Models for TickTick Clone.

This module implements production-ready task management with:
- Infinite nesting using django-treebeard (Materialized Path)
- Smart recurrence using RFC 5545 RRULE strings via django-recurrence
- Lists and Tags for organization
- Habits and HabitLog for daily tracking
- PostgreSQL optimizations (GinIndex, BTreeIndex)

Third-party packages required:
- django-treebeard: For tree structure (infinite subtasks)
- django-recurrence: For RFC 5545 RRULE support
- psycopg2-binary: PostgreSQL adapter
"""

from django.db import models
from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.core.validators import MinValueValidator, MaxValueValidator
from treebeard.mp_tree import MP_Node
from recurrence.fields import RecurrenceField


class List(models.Model):
    """
    List model for categorizing tasks (like TickTick's List feature).
    Each user can have multiple colored lists (e.g., "Work", "Personal", "Shopping").
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lists'
    )
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7,
        default='#1E90FF',
        help_text='Hex color code (e.g., #1E90FF for blue)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text='Icon identifier (e.g., emoji or icon class name)'
    )
    sort_order = models.FloatField(
        default=0.0,
        help_text='Float field for efficient drag-and-drop reordering'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'lists'
        ordering = ['sort_order', 'created_at']
        unique_together = [['user', 'name']]
        indexes = [
            models.Index(fields=['user', 'sort_order'], name='user_list_order_idx'),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"


class Tag(models.Model):
    """
    Tag model for flexible task organization.
    Tags have many-to-many relationship with tasks.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags'
    )
    name = models.CharField(max_length=50)
    color = models.CharField(
        max_length=7,
        default='#808080',
        help_text='Hex color code for tag display'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tags'
        ordering = ['name']
        unique_together = [['user', 'name']]
        indexes = [
            models.Index(fields=['user'], name='tag_user_idx'),
        ]
    
    def __str__(self):
        return f"#{self.name}"


class Task(MP_Node):
    """
    Task model with infinite nesting using django-treebeard's Materialized Path.
    
    Key Features:
    - Infinite subtasks via treebeard.MP_Node
    - RFC 5545 RRULE recurrence via django-recurrence
    - Smart ordering with float field for drag-and-drop
    - Full-text search optimization with GinIndex
    - Comprehensive indexing for performance
    
    Implementation Notes:
    - MP_Node provides: get_children(), get_parent(), get_descendants(), etc.
    - path field is auto-managed by treebeard for tree structure
    - depth field is auto-maintained for tree depth tracking
    """
    
    # Status choices
    STATUS_TODO = 'TODO'
    STATUS_IN_PROGRESS = 'IN_PROGRESS'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CANCELLED = 'CANCELLED'
    
    STATUS_CHOICES = [
        (STATUS_TODO, 'To Do'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    
    # Priority choices
    PRIORITY_NONE = 0
    PRIORITY_LOW = 1
    PRIORITY_MEDIUM = 2
    PRIORITY_HIGH = 3
    
    PRIORITY_CHOICES = [
        (PRIORITY_NONE, 'None'),
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
    ]
    
    # Core fields
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=500)
    notes = models.TextField(
        blank=True,
        help_text='Rich text notes/description for the task'
    )
    
    # Organization
    list = models.ForeignKey(
        List,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='tasks'
    )
    
    # Scheduling
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Due date and time for the task'
    )
    start_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Start date for calendar time-blocking'
    )
    duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text='Duration in minutes for time-blocking'
    )
    
    # Recurrence (RFC 5545 RRULE support)
    recurrence = RecurrenceField(
        null=True,
        blank=True,
        help_text='RFC 5545 RRULE for recurring tasks (e.g., "Every 3rd Friday")'
    )
    
    # Priority and Status
    priority = models.IntegerField(
        choices=PRIORITY_CHOICES,
        default=PRIORITY_NONE
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_TODO
    )
    
    # Smart Ordering (float for efficient drag-and-drop)
    kanban_order = models.FloatField(
        default=0.0,
        help_text='Float field allows inserting tasks between others without rewriting all rows'
    )
    
    # Completion tracking
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Treebeard configuration
    node_order_by = ['kanban_order']
    
    class Meta:
        db_table = 'tasks'
        ordering = ['kanban_order', 'created_at']
        indexes = [
            # Full-text search indexes using PostgreSQL GinIndex
            GinIndex(
                fields=['title'],
                name='task_title_gin_idx',
                opclasses=['gin_trgm_ops']
            ),
            GinIndex(
                fields=['notes'],
                name='task_notes_gin_idx',
                opclasses=['gin_trgm_ops']
            ),
            
            # Performance indexes for common queries
            models.Index(fields=['due_date'], name='task_due_date_idx'),
            models.Index(fields=['priority'], name='task_priority_idx'),
            models.Index(fields=['status'], name='task_status_idx'),
            
            # Composite indexes for filtered queries
            models.Index(
                fields=['user', 'due_date'],
                name='task_user_due_idx'
            ),
            models.Index(
                fields=['user', 'status'],
                name='task_user_status_idx'
            ),
            models.Index(
                fields=['user', 'list', 'kanban_order'],
                name='task_user_list_order_idx'
            ),
            
            # Index for tree queries (treebeard uses path field)
            models.Index(fields=['path'], name='task_path_idx'),
        ]
    
    def __str__(self):
        indent = '  ' * (self.depth - 1) if self.depth > 1 else ''
        return f"{indent}{self.title}"
    
    def save(self, *args, **kwargs):
        """Override save to handle status changes and completion tracking."""
        # Update completed_at when status changes to COMPLETED
        if self.status == self.STATUS_COMPLETED and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        elif self.status != self.STATUS_COMPLETED:
            self.completed_at = None
        
        super().save(*args, **kwargs)
    
    @property
    def is_recurring(self):
        """Check if task has recurrence rule."""
        return self.recurrence is not None
    
    @property
    def has_subtasks(self):
        """Check if task has children."""
        return self.get_children().exists()
    
    @property
    def subtask_count(self):
        """Get number of direct children."""
        return self.get_children().count()
    
    @property
    def all_subtasks_count(self):
        """Get total number of descendants."""
        return self.get_descendants().count()


class Habit(models.Model):
    """
    Habit model for daily/weekly habit tracking.
    Separate from tasks as habits have different behavior patterns.
    """
    
    FREQUENCY_DAILY = 'DAILY'
    FREQUENCY_WEEKLY = 'WEEKLY'
    FREQUENCY_CUSTOM = 'CUSTOM'
    
    FREQUENCY_CHOICES = [
        (FREQUENCY_DAILY, 'Daily'),
        (FREQUENCY_WEEKLY, 'Weekly'),
        (FREQUENCY_CUSTOM, 'Custom'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='habits'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    color = models.CharField(
        max_length=7,
        default='#4CAF50',
        help_text='Hex color for habit display'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text='Icon identifier for habit'
    )
    
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default=FREQUENCY_DAILY
    )
    
    # For weekly habits: how many days per week
    target_days = models.IntegerField(
        default=7,
        validators=[MinValueValidator(1), MaxValueValidator(7)],
        help_text='Target days per week (for weekly habits)'
    )
    
    # Custom recurrence (for CUSTOM frequency)
    recurrence = RecurrenceField(
        null=True,
        blank=True,
        help_text='Custom recurrence pattern for habits'
    )
    
    # Ordering
    sort_order = models.FloatField(default=0.0)
    
    # Active status
    is_active = models.BooleanField(
        default=True,
        help_text='Whether habit is currently being tracked'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'habits'
        ordering = ['sort_order', 'created_at']
        indexes = [
            models.Index(fields=['user', 'is_active'], name='habit_user_active_idx'),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"


class HabitLog(models.Model):
    """
    HabitLog model for tracking daily habit completions.
    Each entry represents whether a habit was completed on a specific date.
    """
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='logs'
    )
    date = models.DateField(
        help_text='Date of the habit check-in'
    )
    completed = models.BooleanField(
        default=False,
        help_text='Whether habit was completed on this date'
    )
    notes = models.TextField(
        blank=True,
        help_text='Optional notes about the habit completion'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'habit_logs'
        ordering = ['-date']
        unique_together = [['habit', 'date']]
        indexes = [
            models.Index(fields=['habit', 'date'], name='habit_log_date_idx'),
            models.Index(fields=['habit', 'completed'], name='habit_log_completed_idx'),
        ]
    
    def __str__(self):
        status = '✓' if self.completed else '✗'
        return f"{self.habit.name} - {self.date} [{status}]"


def task_attachment_path(instance, filename):
    """Generate upload path for task attachments."""
    return f'task_attachments/{instance.task.id}/{filename}'


class TaskAttachment(models.Model):
    """
    Model for storing file attachments for tasks.
    Supports multiple files per task.
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(
        upload_to=task_attachment_path,
        help_text='Attached file'
    )
    file_name = models.CharField(
        max_length=255,
        help_text='Original filename'
    )
    file_size = models.PositiveIntegerField(
        help_text='File size in bytes'
    )
    file_type = models.CharField(
        max_length=100,
        blank=True,
        help_text='MIME type of the file'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_task_attachments'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'task_attachments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['task', 'created_at'], name='task_attach_task_idx'),
        ]
    
    def __str__(self):
        return f"{self.task.title} - {self.file_name}"
    
    def save(self, *args, **kwargs):
        """Auto-populate file metadata on save."""
        if self.file and not self.file_name:
            self.file_name = self.file.name.split('/')[-1]
        if self.file and not self.file_size:
            self.file_size = self.file.size
        super().save(*args, **kwargs)
    
    @property
    def is_image(self):
        """Check if the file is an image."""
        image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        return self.file_type in image_types
    
    @property
    def file_extension(self):
        """Get file extension."""
        return self.file_name.split('.')[-1].lower() if '.' in self.file_name else ''

