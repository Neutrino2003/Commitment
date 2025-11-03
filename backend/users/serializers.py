from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CustomUser, UserStatistics

class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'leniency'
        ]
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', '')
        )
        # Create user statistics
        UserStatistics.objects.create(user=user)
        return user

class UserStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for user statistics"""
    
    class Meta:
        model = UserStatistics
        fields = [
            'total_stakes', 'total_contracts',
            'successful_contracts', 'failed_contracts',
            'total_loss', 'complaints_applied', 'complaints_approved',
            'complaints_rejected', 'last_updated'
        ]
        read_only_fields = '__all__'