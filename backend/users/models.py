from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from decimal import Decimal

# Create your models here.
class CustomUser(AbstractUser):
    """Custom user model extending AbstractUser with additional fields"""
    LENIENCY_CHOICES = [
        ('lenient', 'Lenient'),
        ('normal', 'Normal'),
        ('hard', 'Hard'),
    ]
    leniency = models.CharField(
        max_length=10,
        choices=LENIENCY_CHOICES,
        default='normal',
    )
    
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_groups',
        blank=True,
        help_text='The groups this user belongs to.',
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
    )

    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
    
    @property
    def success_rate(self):
        """Calculate success rate as percentage"""
        total = self.successful_contracts + self.failed_contracts
        if total == 0:
            return 0
        return (self.successful_contracts / total) * 100
    
class UserStatistics(models.Model):
    """Model to track user statistics over time"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='statistics')
    date = models.DateField(default=timezone.now)
    
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
    
    def __str__(self):
        return f"Stats for {self.user.username} on {self.date}"