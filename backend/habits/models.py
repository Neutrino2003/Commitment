"""
Habits App Models

This module defines models for habit tracking with streak calculation.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import date, timedelta


class Habit(models.Model):
    """
    Recurring behavior tracking (e.g., 'Drink Water', 'Exercise').
    Separate from Task because the logic for 'streaks' is different.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='habits'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Frequency configuration
    # Binary string representing Mon-Sun (1=active, 0=inactive)
    # Example: "1111111" = every day, "1010100" = Mon, Wed, Fri
    days_of_week = models.CharField(
        max_length=7,
        default="1111111",
        help_text='Binary string for Mon-Sun (1=active day)'
    )

    # Streak tracking
    current_streak = models.IntegerField(default=0)
    best_streak = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.user.username})"

    def is_active_on_day(self, day_index):
        """
        Check if habit is active on a specific day.
        day_index: 0=Monday, 6=Sunday
        """
        if 0 <= day_index < 7:
            return self.days_of_week[day_index] == '1'
        return False

    def calculate_streak(self):
        """
        Calculate current streak based on HabitLog entries.
        Returns the number of consecutive days the habit was completed.
        """
        today = date.today()
        streak = 0
        check_date = today

        # Count backwards from today
        while True:
            day_index = check_date.weekday()  # 0=Monday, 6=Sunday

            # Only check days where habit is active
            if self.is_active_on_day(day_index):
                try:
                    log = self.logs.get(date=check_date)
                    if not log.completed:
                        break
                    streak += 1
                except HabitLog.DoesNotExist:
                    # If no log for an active day, streak is broken
                    break

            check_date -= timedelta(days=1)

            # Limit lookback to avoid infinite loop
            if (today - check_date).days > 365:
                break

        return streak

    def update_streak(self):
        """Update current and best streak"""
        self.current_streak = self.calculate_streak()
        if self.current_streak > self.best_streak:
            self.best_streak = self.current_streak
        self.save()


class HabitLog(models.Model):
    """
    Daily log entry for habit completion.
    One entry per day per habit.
    """
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='logs'
    )
    date = models.DateField()
    completed = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['habit', 'date']
        indexes = [
            models.Index(fields=['habit', 'date']),
        ]
        ordering = ['-date']

    def __str__(self):
        status = "✓" if self.completed else "✗"
        return f"{self.habit.title} - {self.date} {status}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update streak after saving log
        self.habit.update_streak()
