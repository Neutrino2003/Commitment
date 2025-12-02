"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.views import (
    RegisterView,
    UserProfileViewSet,
    CustomTokenObtainPairView,
    AccountLogout,
)
from commitments.views import CommitmentViewSet, ComplaintViewSet, EvidenceVerificationViewSet, PaidCommitmentsViewSet


router = DefaultRouter()

# Auth and User endpoints
router.register(r'profile', UserProfileViewSet, basename='profile')

# Commitment endpoints
router.register(r'contracts', CommitmentViewSet, basename='contract')
router.register(r'paid-commitments', PaidCommitmentsViewSet, basename='paid-commitment')

# Complaint endpoints
router.register(r'complaints', ComplaintViewSet, basename='complaint')

# Evidence Verification endpoints (Admin only)
router.register(r'evidence-verifications', EvidenceVerificationViewSet, basename='evidence-verification')


urlpatterns = [
    path("admin/", admin.site.urls),
    
    # API endpoints
    path("api/v1/", include(router.urls)),  # Updated to v1
    
    # New productivity apps
    path("api/v1/", include("tasks.urls")),
    path("api/v1/", include("habits.urls")),
    
    # Authentication endpoints (consistent /api/auth/ prefix)
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", AccountLogout.as_view(), name="account_logout"),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    