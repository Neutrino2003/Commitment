from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model."""
    
    list_display = ['username', 'email', 'first_name', 'last_name', 'timezone', 'is_staff']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('timezone',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('timezone',)}),
    )
