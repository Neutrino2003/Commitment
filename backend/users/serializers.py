from rest_framework import serializers
from .models import CustomUser, UserStatistics

class Default_SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number'
        ]
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match"})

        if CustomUser.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Username already taken"})

        if CustomUser.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered"})
        
        return data
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            profile_complete=False
        )
        
    
        # Create user statistics
        UserStatistics.objects.create(user=user)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    success_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'bio', 'profile_image', 'leniency',
            'success_rate', 'profile_complete'
        ]
        read_only_fields = ['id', 'success_rate', 'profile_complete']
        
    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.profile_image = validated_data.get('profile_image', instance.profile_image)
        instance.leniency = validated_data.get('leniency', instance.leniency)
        instance.profile_complete = True  
        instance.save()
        return instance

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
        # Make all fields read-only for statistics (no direct modification via API)
        read_only_fields = fields