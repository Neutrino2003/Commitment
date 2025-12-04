"""
URL Configuration for TickTick Clone project.
All API routes defined here in one place.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Import views from apps
from apps.users.views import RegisterView, UserProfileView
from apps.tasks.views import (
    ListViewSet, TagViewSet, TaskViewSet,
    HabitViewSet, HabitLogViewSet,
    SyncAPIView, CalendarAPIView, TaskReorderAPIView
)
from apps.commitments.views import CommitmentViewSet, ComplaintViewSet, EvidenceVerificationViewSet

# Create routers
router = DefaultRouter()

# Tasks app routes
router.register(r'lists', ListViewSet, basename='list')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'habit-logs', HabitLogViewSet, basename='habitlog')

# Commitments app routes
router.register(r'commitments', CommitmentViewSet, basename='commitment')
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'evidence-verifications', EvidenceVerificationViewSet, basename='evidence-verification')

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Authentication (Users app)
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/profile/', UserProfileView.as_view(), name='profile'),
    
    # Custom API endpoints (Tasks app)
    path('api/sync/', SyncAPIView.as_view(), name='sync'),
    path('api/calendar/', CalendarAPIView.as_view(), name='calendar'),
    path('api/tasks/reorder/', TaskReorderAPIView.as_view(), name='task-reorder'),
    
    # All ViewSet routes (Tasks + Commitments)
    path('api/', include(router.urls)),
]
