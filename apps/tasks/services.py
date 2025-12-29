"""
Service layer for Task Management business logic.

This module contains business logic separated from views:
- RecurrenceService: Handles RRULE calculations and recurring task expansion
- TaskService: Task operations like reordering and moving
- HabitService: Habit tracking and streak calculations

Why a service layer?
- Keeps views thin and focused on HTTP concerns
- Makes business logic reusable across API and admin
- Easier to test business logic in isolation
- Clearer separation of concerns
"""

from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any
from django.utils import timezone
from django.db.models import Q
from .models import Task, Habit, HabitLog


class RecurrenceService:
    """
    Service for handling recurring tasks and RRULE operations.
    """
    
    @staticmethod
    def get_next_occurrence(task: Task, after: Optional[datetime] = None) -> Optional[datetime]:
        """
        Calculate the next occurrence of a recurring task.
        
        Args:
            task: Task with recurrence rule
            after: Calculate next occurrence after this datetime (default: now)
            
        Returns:
            Next occurrence datetime or None if no more occurrences
        """
        if not task.recurrence:
            return None
        
        if after is None:
            after = timezone.now()
        
        # django-recurrence provides .after() method to get next occurrence
        # after a given datetime
        try:
            occurrences = task.recurrence.after(after, inc=False, dtstart=task.due_date or after)
            return occurrences
        except (StopIteration, AttributeError):
            return None
    
    @staticmethod
    def expand_recurring_instances(
        task: Task,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Expand a recurring task into virtual instances for a date range.
        These are NOT saved to database - they're generated on-the-fly for calendar views.
        
        Args:
            task: Recurring task to expand
            start_date: Start of date range
            end_date: End of date range
            
        Returns:
            List of dicts representing virtual task instances
        """
        if not task.recurrence:
            # Non-recurring task - return single instance if in range
            if task.due_date and start_date <= task.due_date <= end_date:
                return [RecurrenceService._task_to_dict(task, task.due_date)]
            return []
        
        instances = []
        
        # Get all occurrences in the date range using django-recurrence
        # The between() method returns all occurrences between two dates
        try:
            dtstart = task.due_date or start_date
            occurrences = task.recurrence.between(
                start_date,
                end_date,
                inc=True,
                dtstart=dtstart
            )
            
            for occurrence in occurrences:
                instances.append(RecurrenceService._task_to_dict(task, occurrence))
        
        except (StopIteration, AttributeError):
            pass
        
        return instances
    
    @staticmethod
    def _task_to_dict(task: Task, occurrence_date: datetime) -> Dict[str, Any]:
        """
        Convert a task and occurrence date to a dictionary for API responses.
        
        Args:
            task: Original task
            occurrence_date: Specific occurrence date
            
        Returns:
            Dict with task data for this occurrence
        """
        return {
            'id': f"{task.id}_{occurrence_date.isoformat()}",  # Virtual ID
            'original_id': task.id,
            'title': task.title,
            'notes': task.notes,
            'due_date': occurrence_date.isoformat(),
            'start_date': task.start_date.isoformat() if task.start_date else None,
            'duration_minutes': task.duration_minutes,
            'priority': task.priority,
            'status': task.status,
            'list_id': task.list_id,
            'is_recurring': True,
            'is_virtual': True,  # Flag to indicate this is a virtual instance
        }
    
    @staticmethod
    def complete_recurring_task(task: Task) -> Task:
        """
        Complete a recurring task and calculate next occurrence.
        
        For recurring tasks, completion means:
        1. Mark current instance as complete
        2. Calculate next due date from RRULE
        3. Reset to TODO status with new due date
        
        Args:
            task: Recurring task to complete
            
        Returns:
            Updated task with next occurrence
        """
        if not task.recurrence:
            # Non-recurring task - just mark complete
            task.status = Task.STATUS_COMPLETED
            task.save()
            return task
        
        # Get next occurrence after current due date
        next_due = RecurrenceService.get_next_occurrence(
            task,
            after=task.due_date or timezone.now()
        )
        
        if next_due:
            # Update task to next occurrence
            task.due_date = next_due
            task.status = Task.STATUS_TODO
            task.completed_at = None
            task.save()
        else:
            # No more occurrences - mark as completed
            task.status = Task.STATUS_COMPLETED
            task.save()
        
        return task


class TaskService:
    """
    Service for task operations.
    """
    
    @staticmethod
    def reorder_tasks(task_orders: List[Dict[str, Any]]) -> None:
        """
        Bulk update kanban_order for drag-and-drop reordering.
        
        Using float fields allows inserting tasks between others:
        - Task A: order 1.0
        - Task B: order 2.0
        - Insert between: order 1.5
        
        Args:
            task_orders: List of {'id': task_id, 'order': new_order_float}
        """
        tasks_to_update = []
        
        for item in task_orders:
            task = Task.objects.get(id=item['id'])
            task.kanban_order = item['order']
            tasks_to_update.append(task)
        
        # Bulk update for performance
        Task.objects.bulk_update(tasks_to_update, ['kanban_order'])
    
    @staticmethod
    def move_task_to_list(task: Task, new_list) -> Task:
        """
        Move a task to a different list.
        
        Args:
            task: Task to move
            new_list: Target List instance or None (for inbox)
            
        Returns:
            Updated task
        """
        task.list = new_list
        task.save()
        return task
    
    @staticmethod
    def get_tasks_by_date_range(
        user,
        start_date: datetime,
        end_date: datetime,
        include_recurring: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get all tasks (including expanded recurring instances) for a date range.
        This is used by the calendar view.
        
        Args:
            user: User to get tasks for
            start_date: Start of range
            end_date: End of range
            include_recurring: Whether to expand recurring tasks
            
        Returns:
            List of task dicts (mix of real and virtual instances)
        """
        # Get all tasks with due dates in range (non-recurring OR recurring)
        tasks = Task.objects.filter(
            user=user,
            due_date__isnull=False
        ).select_related('list').prefetch_related('tags')
        
        all_instances = []
        
        for task in tasks:
            if task.is_recurring and include_recurring:
                # Expand recurring task into virtual instances
                instances = RecurrenceService.expand_recurring_instances(
                    task, start_date, end_date
                )
                all_instances.extend(instances)
            else:
                # Regular task - include if in range
                if start_date <= task.due_date <= end_date:
                    all_instances.append(RecurrenceService._task_to_dict(task, task.due_date))
        
        return all_instances


class HabitService:
    """
    Service for habit tracking operations.
    """
    
    @staticmethod
    def log_habit_completion(
        habit: Habit,
        log_date: date,
        completed: bool,
        notes: str = ''
    ) -> HabitLog:
        """
        Create or update a habit log entry.
        
        Args:
            habit: Habit to log
            log_date: Date of the log
            completed: Whether habit was completed
            notes: Optional notes
            
        Returns:
            HabitLog instance
        """
        log, created = HabitLog.objects.update_or_create(
            habit=habit,
            date=log_date,
            defaults={
                'completed': completed,
                'notes': notes
            }
        )
        return log
    
    @staticmethod
    def get_habit_streak(habit: Habit) -> int:
        """
        Calculate current streak for a habit.
        Streak = consecutive days the habit was completed.
        
        Args:
            habit: Habit to calculate streak for
            
        Returns:
            Current streak count
        """
        today = timezone.now().date()
        streak = 0
        
        # Only count daily habits for now (weekly habits need different logic)
        if habit.frequency != Habit.FREQUENCY_DAILY:
            return 0
        
        # Check backwards from today
        current_date = today
        
        while True:
            try:
                log = HabitLog.objects.get(habit=habit, date=current_date)
                if log.completed:
                    streak += 1
                    current_date -= timedelta(days=1)
                else:
                    # Streak broken
                    break
            except HabitLog.DoesNotExist:
                # No log for this date - streak broken
                break
        
        return streak
    
    @staticmethod
    def get_habit_completion_rate(habit: Habit, days: int = 30) -> float:
        """
        Calculate completion rate for a habit over the last N days.
        
        Args:
            habit: Habit to calculate for
            days: Number of days to look back
            
        Returns:
            Completion rate as percentage (0.0 to 100.0)
        """
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        logs = HabitLog.objects.filter(
            habit=habit,
            date__gte=start_date,
            date__lte=end_date
        )
        
        total_days = (end_date - start_date).days + 1
        completed_days = logs.filter(completed=True).count()
        
        if total_days == 0:
            return 0.0
        
        return (completed_days / total_days) * 100.0
