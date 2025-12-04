"""
User model for TickTick Clone.
Custom user with timezone support for proper due date calculations.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds timezone field for proper task scheduling across timezones.
    """
    timezone = models.CharField(
        max_length=63,
        default='UTC',
        help_text='User timezone for task scheduling (e.g., America/New_York)'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.username
