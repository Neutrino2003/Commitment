from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import date
from decimal import Decimal

# Create your models here.
class CustomUser(AbstractUser):
    """Custom user model extending AbstractUser with additional fields"""
    
    
    LENIENCY_CHOICES = [
        ('lenient', 'Lenient'),
        ('normal', 'Normal'),
        ('hard', 'Hard'),
    ]
        
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    profile_complete = models.BooleanField(default=False)

    bio = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    leniency = models.CharField(
        max_length=10,
        choices=LENIENCY_CHOICES,
        default='normal',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
    
    @property
    def success_rate(self):
        """Calculate success rate as percentage from user statistics"""
        stats = self.statistics.first()  # Get latest statistics
        if not stats:
            return 0
        total = stats.successful_contracts + stats.failed_contracts
        if total == 0:
            return 0
        return (stats.successful_contracts / total) * 100
    

class UserStatistics(models.Model):
    """Model to track user statistics over time"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='statistics')
    date = models.DateField(default=date.today)  # Fixed: use callable
    
    total_stakes = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    total_contracts = models.IntegerField(default=0)
    successful_contracts = models.IntegerField(default=0)
    failed_contracts = models.IntegerField(default=0)
    total_loss = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    complaints_applied = models.IntegerField(default=0)
    complaints_approved = models.IntegerField(default=0)
    complaints_rejected = models.IntegerField(default=0)

    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Statistics"
        verbose_name_plural = "User Statistics"
        constraints = [
            models.UniqueConstraint(fields=['user', 'date'], name='unique_user_date_stats')
        ]
    
    def __str__(self):
        return f"Stats for {self.user.username} on {self.date}"