from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from .models import CustomUser, UserStatistics


class UserStatisticsInline(admin.TabularInline):
    """Inline display of user statistics"""
    model = UserStatistics
    extra = 0
    readonly_fields = ('date', 'total_contracts', 'successful_contracts', 'failed_contracts', 'total_stakes', 'total_loss', 'last_updated')
    can_delete = False
    max_num = 5  # Show only latest 5
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Enhanced custom user admin"""
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Information', {
            'fields': ('bio', 'profile_image', 'phone_number')
        }),
        ('Preferences', {
            'fields': ('leniency', 'profile_complete')
        }),
        ('Timestamps', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone_number', 'leniency')
        }),
    )
    
    list_display = (
        'username', 'email', 'full_name', 'leniency_badge', 
        'profile_complete_badge', 'is_staff', 'is_active', 'date_joined'
    )
    list_filter = ('leniency', 'profile_complete', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')
    readonly_fields = ('date_joined', 'updated_at', 'last_login')
    inlines = [UserStatisticsInline]
    
    def full_name(self, obj):
        """Display full name"""
        return obj.get_full_name() or '-'
    full_name.short_description = 'Name'
    
    def leniency_badge(self, obj):
        """Colored leniency badge"""
        colors = {
            'lenient': '#28a745',
            'normal': '#ffc107',
            'hard': '#dc3545',
        }
        color = colors.get(obj.leniency, '#6c757d')
        return format_html(
            '<span style="padding: 3px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            color, obj.get_leniency_display()
        )
    leniency_badge.short_description = 'Leniency'
    
    def profile_complete_badge(self, obj):
        """Profile completion badge"""
        if obj.profile_complete:
            return format_html('<span style="color: green;">✓ Complete</span>')
        return format_html('<span style="color: orange;">⚠ Incomplete</span>')
    profile_complete_badge.short_description = 'Profile'


@admin.register(UserStatistics)
class UserStatisticsAdmin(admin.ModelAdmin):
    """Enhanced user statistics admin"""
    list_display = (
        'user_link', 'date', 'total_contracts', 'successful_contracts', 
        'failed_contracts', 'success_rate_display', 'total_stakes', 'total_loss'
    )
    list_filter = ('date', 'user')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('last_updated',)
    date_hierarchy = 'date'
    
    fieldsets = (
        ('User & Date', {
            'fields': ('user', 'date')
        }),
        ('Contract Statistics', {
            'fields': ('total_contracts', 'successful_contracts', 'failed_contracts')
        }),
        ('Financial Statistics', {
            'fields': ('total_stakes', 'total_loss')
        }),
        ('Complaint Statistics', {
            'fields': ('complaints_applied', 'complaints_approved', 'complaints_rejected'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('last_updated',),
            'classes': ('collapse',)
        }),
    )
    
    def user_link(self, obj):
        """Link to user in admin"""
        url = reverse('admin:users_customuser_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    
    def success_rate_display(self, obj):
        """Display success rate"""
        total = obj.successful_contracts + obj.failed_contracts
        if total == 0:
            return '-'
        rate = (obj.successful_contracts / total) * 100
        color = '#28a745' if rate >= 70 else '#ffc107' if rate >= 40 else '#dc3545'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color, rate
        )
    success_rate_display.short_description = 'Success Rate'
