"""
User authentication views.
"""
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    
    POST /api/auth/register/
    Body: {
        "username": "user",
        "email": "user@example.com",
        "password": "password123",
        "password2": "password123",
        "timezone": "America/New_York"
    }
    """
    
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user profile.
    
    GET /api/auth/profile/
    PATCH /api/auth/profile/
    """
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        """Return current user."""
        return self.request.user
