from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import logout, get_user_model
from django.views.generic import TemplateView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.throttling import SimpleRateThrottle


from .serializers import Default_SignupSerializer, UserProfileSerializer, UserStatisticsSerializer
from .models import CustomUser, UserStatistics


class AuthThrottle(SimpleRateThrottle):
    """Custom throttle for auth endpoints: 5 requests/minute"""
    scope = 'auth'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on IP address for anonymous users,
        or user ID for authenticated users.
        """
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }

class AccountLogout(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = [AuthThrottle]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            logout(request)
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user data"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        return data

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view"""
    throttle_classes = [AuthThrottle]
    def get_serializer_class(self):
        return CustomTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]
    
    def post(self, request):
        serializer = Default_SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Registration successful.',
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'profile_complete': user.profile_complete,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile management"""
    
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get current user profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Get specific user profile (public)"""
        try:
            user = CustomUser.objects.get(pk=pk)
            serializer = UserProfileSerializer(user)
            return Response(serializer.data)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                UserProfileSerializer(request.user).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password_confirm = request.data.get('new_password_confirm')
        
        if not request.user.check_password(old_password):
            return Response(
                {'old_password': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != new_password_confirm:
            return Response(
                {'new_password': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request.user.set_password(new_password)
        request.user.save()
        
        return Response(
            {'detail': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )
        
class UserStatisticsViewSet(viewsets.ViewSet):
    """User statistics"""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get current user statistics"""
        try:
            from .models import UserStatistics
            stats = UserStatistics.objects.get(user=request.user)
            serializer = UserStatisticsSerializer(stats)
            return Response(serializer.data)
        except UserStatistics.DoesNotExist:
            return Response(
                {'detail': 'Statistics not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def retrieve(self, request, pk=None):
        """Get specific user statistics (public)"""
        try:
            user = CustomUser.objects.get(pk=pk)
            stats = UserStatistics.objects.get(user=user)
            serializer = UserStatisticsSerializer(stats)
            return Response(serializer.data)
        except (CustomUser.DoesNotExist, UserStatistics.DoesNotExist):
            return Response(
                {'detail': 'Statistics not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class AccountTemplateView(TemplateView):
    """Template view for authentication testing"""
    template_name = 'accounts/account.html'
    permission_classes = [AllowAny]
