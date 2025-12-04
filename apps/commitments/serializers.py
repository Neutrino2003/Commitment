"""
Serializers for Commitments App.

Supports:
- Reading commitments with nested task information
- Creating commitments linked to existing tasks (task_id)
- Direct creation with new task data (task_data)
"""

from rest_framework import serializers
from django.db import transaction
from .models import Commitment, Complaint, EvidenceVerification
from apps.tasks.models import Task, List
from apps.tasks.serializers import TaskSerializer


class CommitmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Commitment model.
    
    Supports two creation modes:
    1. task_id: Link to an existing task
    2. task_data: Create a new task and link to it
    """
    
    # Read-only nested task info
    task = TaskSerializer(read_only=True)
    
    # Write options
    task_id = serializers.IntegerField(write_only=True, required=False)
    task_data = serializers.DictField(write_only=True, required=False)
    
    # Computed fields
    title = serializers.CharField(read_only=True)
    due_date = serializers.DateTimeField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    is_paid = serializers.SerializerMethodField()
    
    class Meta:
        model = Commitment
        fields = [
            'id',
            # Task relationship
            'task', 'task_id', 'task_data',
            # Computed from task
            'title', 'due_date', 'is_overdue',
            # Status & Stakes
            'status', 'stake_type', 'stake_amount', 'currency', 'leniency',
            'is_paid',
            # Evidence
            'evidence_required', 'evidence_type', 'evidence_file', 'evidence_text',
            'evidence_submitted', 'evidence_submitted_at',
            # Complaints
            'complaints_flagged', 'complaint',
            # Timestamps
            'created_at', 'updated_at', 'activated_at', 'completed_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'activated_at', 'completed_at',
            'evidence_submitted', 'evidence_submitted_at'
        ]
    
    def get_is_paid(self, obj):
        return obj.is_paid_commitment
    
    def validate(self, attrs):
        """Ensure either task_id or task_data is provided, but not both."""
        task_id = attrs.get('task_id')
        task_data = attrs.get('task_data')
        
        if self.instance:  # Update - no need for task
            return attrs
        
        if not task_id and not task_data:
            raise serializers.ValidationError(
                "Either 'task_id' or 'task_data' must be provided"
            )
        
        if task_id and task_data:
            raise serializers.ValidationError(
                "Provide either 'task_id' or 'task_data', not both"
            )
        
        # Validate task_id belongs to current user
        if task_id:
            request = self.context.get('request')
            if request and request.user:
                try:
                    task = Task.objects.get(id=task_id, user=request.user)
                    # Check if task already has a commitment
                    if hasattr(task, 'commitment'):
                        raise serializers.ValidationError(
                            "This task already has a commitment attached"
                        )
                except Task.DoesNotExist:
                    raise serializers.ValidationError(
                        "Task not found or does not belong to you"
                    )
        
        return attrs
    
    def create(self, validated_data):
        """Create commitment with task linking or creation."""
        task_id = validated_data.pop('task_id', None)
        task_data = validated_data.pop('task_data', None)
        
        request = self.context.get('request')
        user = request.user if request else None
        
        with transaction.atomic():
            if task_id:
                # Link to existing task
                task = Task.objects.get(id=task_id, user=user)
            else:
                # Create new task from task_data
                task_data['user'] = user
                
                # Handle list - use default or provided
                if 'list_id' in task_data:
                    task_data['list_id'] = task_data.pop('list_id')
                else:
                    # Get or create default list for user
                    default_list, _ = List.objects.get_or_create(
                        user=user,
                        name='Commitments',
                        defaults={'color': '#FF6B6B', 'icon': '🎯'}
                    )
                    task_data['list'] = default_list
                
                # Create as root task
                task = Task.add_root(**task_data)
            
            # Create commitment
            commitment = Commitment.objects.create(task=task, **validated_data)
        
        return commitment


class CommitmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    
    title = serializers.CharField(read_only=True)
    due_date = serializers.DateTimeField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Commitment
        fields = [
            'id', 'title', 'status', 'stake_type', 'stake_amount',
            'due_date', 'is_overdue', 'evidence_submitted', 'created_at'
        ]


class ComplaintSerializer(serializers.ModelSerializer):
    """Serializer for Complaint model."""
    
    commitment_title = serializers.CharField(source='commitment.task.title', read_only=True)
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'commitment', 'commitment_title',
            'reason_category', 'description', 'evidence_file',
            'status', 'review_notes', 'reviewed_at',
            'refund_amount', 'refund_processed', 'refund_processed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'status', 'review_notes', 'reviewed_at', 'reviewed_by',
            'refund_amount', 'refund_processed', 'refund_processed_at',
            'created_at', 'updated_at'
        ]
    
    def validate_commitment(self, value):
        """Ensure user owns the commitment and it's in a valid state."""
        request = self.context.get('request')
        user = request.user if request else None
        
        if value.task.user != user:
            raise serializers.ValidationError("You don't own this commitment")
        
        if value.status not in ['failed']:
            raise serializers.ValidationError(
                "Complaints can only be filed for failed commitments"
            )
        
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


class EvidenceVerificationSerializer(serializers.ModelSerializer):
    """Serializer for EvidenceVerification model."""
    
    commitment_title = serializers.CharField(source='commitment.task.title', read_only=True)
    
    class Meta:
        model = EvidenceVerification
        fields = [
            'id', 'commitment', 'commitment_title',
            'status', 'notes', 'verified_by', 'verified_at',
            'created_at'
        ]
        read_only_fields = ['verified_by', 'verified_at', 'created_at']


class CommitmentDashboardSerializer(serializers.Serializer):
    """Serializer for dashboard summary data."""
    
    active_count = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    failed_count = serializers.IntegerField()
    total_stakes_at_risk = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_evidence_count = serializers.IntegerField()
    success_rate = serializers.FloatField()
