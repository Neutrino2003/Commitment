from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Commitment, Complaint, EvidenceVerification

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
    evidence_file = serializers.FileField(
        required=False,
        allow_null=True,
        help_text='Evidence file (photo or video)',
        max_length=None
    )
    evidence_text = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
        help_text='Text description or notes for evidence'
    )
    
    def validate_evidence_file(self, value):
        """Validate evidence file"""
        if value:
            # Check file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("File size cannot exceed 10MB")
            
            # Check file extension
            valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.avi', '.mov', '.webm']
            file_ext = value.name.lower()[value.name.rfind('.'):]
            if file_ext not in valid_extensions:
                raise serializers.ValidationError(
                    f"Invalid file type. Allowed types: {', '.join(valid_extensions)}"
                )
            
            # Check MIME type
            valid_mime_types = [
                'image/jpeg', 'image/png', 'image/gif',
                'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/webm'
            ]
            if hasattr(value, 'content_type') and value.content_type not in valid_mime_types:
                raise serializers.ValidationError(
                    f"Invalid file MIME type: {value.content_type}"
                )
        
        return value
    
class ContractStatusActionSerializer(serializers.Serializer):
    """Generic serializer for status change actions (activate, pause, resume, cancel)"""
    pass  # No fields needed

class ContractMarkFailedSerializer(serializers.Serializer):
    """Serializer for marking contract as failed"""
    reason = serializers.CharField(required=False, allow_blank=True)


# ============== COMPLAINT SERIALIZERS ==============

class ComplaintSerializer(serializers.ModelSerializer):
    """Full serializer for Complaint model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    commitment_title = serializers.CharField(source='commitment.title', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    is_pending = serializers.ReadOnlyField()
    is_resolved = serializers.ReadOnlyField()
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'user', 'user_name', 'commitment', 'commitment_title',
            'reason_category', 'description', 'evidence_file',
            'status', 'reviewed_by', 'reviewed_by_name', 'review_notes',
            'reviewed_at', 'refund_amount', 'refund_processed', 'refund_processed_at',
            'is_pending', 'is_resolved', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'reviewed_by', 'review_notes', 'reviewed_at',
            'refund_amount', 'refund_processed', 'refund_processed_at',
            'created_at', 'updated_at'
        ]


class ComplaintListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing complaints"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    commitment_title = serializers.CharField(source='commitment.title', read_only=True)
    commitment_stake = serializers.DecimalField(
        source='commitment.stake_amount',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'user_name', 'commitment', 'commitment_title', 'commitment_stake',
            'reason_category', 'status', 'created_at', 'reviewed_at'
        ]


class ComplaintCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating complaints"""
    
    class Meta:
        model = Complaint
        fields = ['commitment', 'reason_category', 'description', 'evidence_file']
    
    def validate_commitment(self, value):
        """Validate that commitment belongs to the requesting user and is failed"""
        request = self.context.get('request')
        if request and request.user:
            if value.user != request.user:
                raise serializers.ValidationError("You can only file complaints for your own commitments")
            
            if value.status != 'failed':
                raise serializers.ValidationError("Can only file complaints for failed commitments")
            
            # Check if complaint already exists for this commitment
            if Complaint.objects.filter(commitment=value, user=request.user).exists():
                raise serializers.ValidationError("A complaint already exists for this commitment")
        
        return value
    
    def validate_description(self, value):
        """Ensure description is not too short"""
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long")
        return value


class ComplaintReviewSerializer(serializers.Serializer):
    """Serializer for admin reviewing complaints"""
    action = serializers.ChoiceField(choices=['approve', 'reject'], required=True)
    review_notes = serializers.CharField(required=False, allow_blank=True)
    refund_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=0
    )
    
    def validate(self, data):
        """Validate refund amount if action is approve"""
        if data.get('action') == 'approve':
            # Get complaint from context
            complaint = self.context.get('complaint')
            if complaint:
                refund_amount = data.get('refund_amount')
                if refund_amount and refund_amount > complaint.commitment.stake_amount:
                    raise serializers.ValidationError({
                        'refund_amount': 'Refund amount cannot exceed stake amount'
                    })
        return data


# ==============================================================================
# EVIDENCE VERIFICATION SERIALIZERS
# ==============================================================================

class EvidenceVerificationSerializer(serializers.ModelSerializer):
    """Full serializer for Evidence Verification model"""
    commitment_title = serializers.CharField(source='commitment.title', read_only=True)
    commitment_id = serializers.IntegerField(source='commitment.id', read_only=True)
    user_name = serializers.CharField(source='commitment.user.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    evidence_file = serializers.FileField(source='commitment.evidence_file', read_only=True)
    evidence_text = serializers.CharField(source='commitment.evidence_text', read_only=True)
    evidence_type = serializers.CharField(source='commitment.evidence_type', read_only=True)
    is_pending = serializers.ReadOnlyField()
    
    class Meta:
        model = EvidenceVerification
        fields = [
            'id', 'commitment', 'commitment_id', 'commitment_title', 'user_name',
            'evidence_type', 'evidence_file', 'evidence_text',
            'status', 'verified_by', 'verified_by_name', 'notes',
            'is_pending', 'created_at', 'verified_at'
        ]
        read_only_fields = [
            'id', 'commitment', 'verified_by', 'created_at', 'verified_at'
        ]


class EvidenceVerificationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing evidence verifications"""
    commitment_title = serializers.CharField(source='commitment.title', read_only=True)
    user_name = serializers.CharField(source='commitment.user.get_full_name', read_only=True)
    evidence_type = serializers.CharField(source='commitment.evidence_type', read_only=True)
    stake_amount = serializers.DecimalField(
        source='commitment.stake_amount',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = EvidenceVerification
        fields = [
            'id', 'commitment', 'commitment_title', 'user_name',
            'evidence_type', 'stake_amount', 'status', 'created_at'
        ]


class EvidenceVerificationActionSerializer(serializers.Serializer):
    """Serializer for admin evidence verification actions"""
    action = serializers.ChoiceField(
        choices=['approve', 'reject', 'request_more_info'],
        required=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)


# ============================================
# Paid Commitments Serializers
# ============================================

class PaidCommitmentStatsSerializer(serializers.Serializer):
    """Serializer for paid commitments statistics dashboard"""
    total_staked = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_completed = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_forfeited = serializers.DecimalField(max_digits=10, decimal_places=2)
    active_stakes_count = serializers.IntegerField()
    active_stakes_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    completed_count = serializers.IntegerField()
    failed_count = serializers.IntegerField()
    success_rate = serializers.FloatField()

    def to_representation(self, user):
        """Calculate all stats for paid commitments"""
        from django.db.models import Sum
        
        paid_commitments = Commitment.objects.filter(
            user=user,
            stake_type='money'
        )

        # Active commitments
        active = paid_commitments.filter(status='active')
        active_count = active.count()
        active_amount = active.aggregate(
            total=Sum('stake_amount')
        )['total'] or 0

        # Completed commitments
        completed = paid_commitments.filter(status='completed')
        completed_count = completed.count()
        completed_amount = completed.aggregate(
            total=Sum('stake_amount')
        )['total'] or 0

        # Failed commitments
        failed = paid_commitments.filter(status='failed')
        failed_count = failed.count()
        forfeited_amount = failed.aggregate(
            total=Sum('stake_amount')
        )['total'] or 0

        # Total staked (all paid commitments ever)
        total_staked = paid_commitments.aggregate(
            total=Sum('stake_amount')
        )['total'] or 0

        # Success rate
        total_finished = completed_count + failed_count
        success_rate = (completed_count / total_finished * 100) if total_finished > 0 else 0.0

        return {
            'total_staked': total_staked,
            'total_completed': completed_amount,
            'total_forfeited': forfeited_amount,
            'active_stakes_count': active_count,
            'active_stakes_amount': active_amount,
            'completed_count': completed_count,
            'failed_count': failed_count,
            'success_rate': round(success_rate, 1)
        }


class PaidCommitmentSerializer(serializers.ModelSerializer):
    """Serializer specifically for paid (money) commitments"""
    is_overdue = serializers.ReadOnlyField()
    time_remaining = serializers.ReadOnlyField()
    is_paid = serializers.SerializerMethodField()

    class Meta:
        model = Commitment
        fields = [
            'id', 'title', 'description', 'stake_amount', 'currency',
            'status', 'start_time', 'end_time', 'is_overdue',
            'time_remaining', 'evidence_required', 'evidence_submitted',
            'is_paid', 'created_at'
        ]

    def get_is_paid(self, obj):
        """Always true for this serializer"""
        return obj.is_paid_commitment()