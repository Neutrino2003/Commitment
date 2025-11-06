from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Commitment

class CommitmentSerializer(serializers.ModelSerializer):
    """Serializer for Commitment model"""
    time_remaining = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    is_completed_on_time = serializers.ReadOnlyField()
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Commitment
        fields = [
            'id', 'user', 'user_name', 'title', 'description',
            'start_time', 'end_time', 'frequency', 'custom_days',
            'stake_amount', 'currency', 'leniency', 'status',
            'evidence_required', 'evidence_type', 'evidence_file', 'evidence_text',
            'evidence_submitted', 'evidence_submitted_at',
            'complaints_flagged', 'complaint',
            'time_remaining', 'is_overdue', 'is_completed_on_time',
            'created_at', 'updated_at', 'activated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'user', 'time_remaining', 'is_overdue', 'is_completed_on_time',
            'evidence_submitted_at', 'created_at', 'updated_at', 'activated_at', 'completed_at'
        ]


class CommitmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing contracts"""
    is_overdue = serializers.ReadOnlyField()
    time_remaining = serializers.ReadOnlyField()
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Commitment
        fields = [
            'id', 'user_name', 'title', 'stake_amount', 'currency',
            'frequency', 'evidence_type', 'status', 'leniency',
            'is_overdue', 'time_remaining',
            'created_at', 'end_time'
        ]

class CommitmentDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for contract details"""
    is_overdue = serializers.ReadOnlyField()
    time_remaining = serializers.ReadOnlyField()
    is_completed_on_time = serializers.ReadOnlyField()
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Commitment
        fields = [
            'id', 'user', 'user_name', 'title', 'description',
            'start_time', 'end_time', 'frequency', 'custom_days',
            'stake_amount', 'currency', 'leniency', 'status',
            'evidence_required', 'evidence_type', 'evidence_file', 'evidence_text',
            'evidence_submitted', 'evidence_submitted_at',
            'complaints_flagged', 'complaint',
            'time_remaining', 'is_overdue', 'is_completed_on_time',
            'created_at', 'updated_at', 'activated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'user', 'time_remaining', 'is_overdue', 'is_completed_on_time',
            'evidence_submitted_at', 'created_at', 'updated_at', 'activated_at', 'completed_at'
        ]


class CommitmentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating contracts"""
    
    class Meta:
        model = Commitment
        fields = [
            'title', 'description', 'start_time', 'end_time',
            'frequency', 'custom_days', 'stake_amount', 'currency',
            'leniency', 'evidence_required', 'evidence_type'
        ]
    
    def validate_stake_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Stake amount must be positive")
        return value
    
    def validate(self, data):
        if data.get('end_time') and data.get('start_time'):
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError(
                    {"end_time": "End time must be after start time"}
                )
        
        # Validate frequency
        if data.get('frequency') == 'one_time' and data.get('custom_days'):
            raise serializers.ValidationError(
                {"custom_days": "One-time contracts should not have custom days"}
            )
        
        return data
    
class ContractMarkCompleteSerializer(serializers.Serializer):
    """Serializer for marking contract as complete"""
    evidence_type = serializers.ChoiceField(
        choices=['photo', 'timelapse_video', 'self_verification', 'manual'],
        required=False
    )
    evidence_data = serializers.CharField(required=False, allow_blank=True)
    
class ContractStatusActionSerializer(serializers.Serializer):
    """Generic serializer for status change actions (activate, pause, resume, cancel)"""
    pass  # No fields needed

class ContractMarkFailedSerializer(serializers.Serializer):
    """Serializer for marking contract as failed"""
    reason = serializers.CharField(required=False, allow_blank=True)