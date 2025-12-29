"""
User authentication views.
"""
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from django.shortcuts import redirect
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client, OAuth2Error
from allauth.socialaccount.models import SocialLogin, SocialAccount
from allauth.socialaccount.helpers import complete_social_login
import requests

from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()


def get_tokens_for_user(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


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


class GoogleLoginView(APIView):
    """
    Initiate Google OAuth login.
    
    GET /api/auth/google/
    
    Returns the Google OAuth URL to redirect the user to.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        google_config = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
        app_config = google_config.get('APP', {})
        client_id = app_config.get('client_id')
        
        if not client_id:
            return Response(
                {'error': 'Google OAuth is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Build the redirect URI
        redirect_uri = request.build_absolute_uri('/api/auth/google/callback/')
        
        # Build Google OAuth URL
        google_auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"access_type=online"
        )
        
        return Response({
            'auth_url': google_auth_url,
            'redirect_uri': redirect_uri
        })


class GoogleLoginCallbackView(APIView):
    """
    Handle Google OAuth callback.
    
    GET /api/auth/google/callback/?code=...
    
    Exchanges the code for tokens and returns JWT tokens.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        code = request.GET.get('code')
        error = request.GET.get('error')
        
        if error:
            frontend_url = settings.LOGOUT_REDIRECT_URL
            return redirect(f"{frontend_url}?error={error}")
        
        if not code:
            return Response(
                {'error': 'No authorization code provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get Google OAuth config
            google_config = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
            app_config = google_config.get('APP', {})
            client_id = app_config.get('client_id')
            client_secret = app_config.get('secret')
            
            redirect_uri = request.build_absolute_uri('/api/auth/google/callback/')
            
            # Exchange code for tokens
            token_response = requests.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'code': code,
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'redirect_uri': redirect_uri,
                    'grant_type': 'authorization_code',
                }
            )
            
            if token_response.status_code != 200:
                frontend_url = settings.LOGOUT_REDIRECT_URL
                return redirect(f"{frontend_url}?error=token_exchange_failed")
            
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            
            # Get user info from Google
            userinfo_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            if userinfo_response.status_code != 200:
                frontend_url = settings.LOGOUT_REDIRECT_URL
                return redirect(f"{frontend_url}?error=userinfo_failed")
            
            userinfo = userinfo_response.json()
            email = userinfo.get('email')
            google_id = userinfo.get('id')
            name = userinfo.get('name', '')
            
            # Find or create user
            try:
                # Check if social account exists
                social_account = SocialAccount.objects.get(
                    provider='google',
                    uid=google_id
                )
                user = social_account.user
            except SocialAccount.DoesNotExist:
                # Check if user with this email exists
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    # Create new user
                    username = email.split('@')[0]
                    # Ensure unique username
                    base_username = username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{counter}"
                        counter += 1
                    
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        first_name=name.split()[0] if name else '',
                        last_name=' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''
                    )
                
                # Create social account link
                SocialAccount.objects.create(
                    user=user,
                    provider='google',
                    uid=google_id,
                    extra_data=userinfo
                )
            
            # Generate JWT tokens
            tokens = get_tokens_for_user(user)
            
            # Redirect to frontend with tokens
            frontend_url = settings.LOGIN_REDIRECT_URL.replace('/dashboard', '')
            redirect_url = (
                f"{frontend_url}/auth/callback?"
                f"access={tokens['access']}&"
                f"refresh={tokens['refresh']}"
            )
            
            return redirect(redirect_url)
            
        except Exception as e:
            frontend_url = settings.LOGOUT_REDIRECT_URL
            return redirect(f"{frontend_url}?error=oauth_failed&message={str(e)}")

