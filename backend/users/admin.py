from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser, UserStatistics


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Custom user admin"""
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Preferences', {
            'fields': ('leniency', 'phone_number')
        }),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'leniency', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('leniency', 'is_staff', 'is_active')


@admin.register(UserStatistics)
class UserStatisticsAdmin(admin.ModelAdmin):
    """User statistics admin"""
    list_display = ('user', 'date', 'total_contracts', 'successful_contracts', 'failed_contracts', 'total_stakes')
    list_filter = ('date', 'user')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('last_updated',)

