"""
Views for Commitments App.

Provides REST API endpoints for:
- Commitment CRUD with direct creation support
- Complaint filing and management
- Dashboard statistics
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from decimal import Decimal
import logging

from .models import Commitment, Complaint, EvidenceVerification
from .serializers import (
    CommitmentSerializer,
    CommitmentListSerializer,
    ComplaintSerializer,
    EvidenceVerificationSerializer,
    CommitmentDashboardSerializer,
)

logger = logging.getLogger(__name__)


class CommitmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Commitment CRUD operations.
    
    Supports:
    - GET /api/commitments/ - List user's commitments
    - POST /api/commitments/ - Create new commitment (with task_id or task_data)
    - GET /api/commitments/{id}/ - Retrieve commitment
    - PUT/PATCH /api/commitments/{id}/ - Update commitment
    - DELETE /api/commitments/{id}/ - Delete commitment
    - GET /api/commitments/dashboard/ - Get dashboard stats
    - POST /api/commitments/{id}/activate/ - Activate draft
    - POST /api/commitments/{id}/submit_evidence/ - Submit evidence
    - POST /api/commitments/{id}/complete/ - Mark completed
    - POST /api/commitments/{id}/fail/ - Mark failed
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Commitment.objects.filter(
            task__user=self.request.user
        ).select_related('task', 'task__list').order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CommitmentListSerializer
        return CommitmentSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to add logging and better error handling."""
        logger.info(f"Creating commitment with data: {request.data}")
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating commitment: {str(e)}", exc_info=True)
            raise
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard statistics for commitments."""
        queryset = self.get_queryset()
        
        # Count by status
        active_count = queryset.filter(status='active').count()
        completed_count = queryset.filter(status='completed').count()
        failed_count = queryset.filter(status='failed').count()
        
        # Total money at risk (active commitments with money stakes)
        stakes_at_risk = queryset.filter(
            status='active',
            stake_type='money'
        ).aggregate(total=Sum('stake_amount'))['total'] or Decimal('0.00')
        
        # Pending evidence count
        pending_evidence = queryset.filter(
            status='active',
            evidence_required=True,
            evidence_submitted=False
        ).count()
        
        # Success rate
        total_resolved = completed_count + failed_count
        success_rate = (completed_count / total_resolved * 100) if total_resolved > 0 else 0
        
        data = {
            'active_count': active_count,
            'completed_count': completed_count,
            'failed_count': failed_count,
            'total_stakes_at_risk': stakes_at_risk,
            'pending_evidence_count': pending_evidence,
            'success_rate': round(success_rate, 1)
        }
        
        serializer = CommitmentDashboardSerializer(data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a draft commitment."""
        commitment = self.get_object()
        try:
            commitment.activate()
            return Response(CommitmentSerializer(commitment, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def submit_evidence(self, request, pk=None):
        """Submit evidence for a commitment."""
        commitment = self.get_object()
        
        evidence_type = request.data.get('evidence_type')
        evidence_file = request.FILES.get('evidence_file')
        evidence_text = request.data.get('evidence_text', '')
        
        try:
            commitment.submit_evidence(
                evidence_type=evidence_type,
                evidence_file=evidence_file,
                evidence_text=evidence_text
            )
            return Response(CommitmentSerializer(commitment, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a commitment as completed."""
        commitment = self.get_object()
        try:
            commitment.mark_completed()
            return Response(CommitmentSerializer(commitment, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def fail(self, request, pk=None):
        """Mark a commitment as failed."""
        commitment = self.get_object()
        reason = request.data.get('reason', '')
        try:
            commitment.mark_failed(reason=reason)
            return Response(CommitmentSerializer(commitment, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause an active commitment."""
        commitment = self.get_object()
        try:
            commitment.pause()
            return Response(CommitmentSerializer(commitment, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused commitment."""
        commitment = self.get_object()
        try:
            commitment.resume()
            return Response(CommitmentSerializer(commitment, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a commitment."""
        commitment = self.get_object()
        try:
            commitment.cancel()
            return Response(CommitmentSerializer(commitment, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ComplaintViewSet(viewsets.ModelViewSet):
    """ViewSet for filing and managing complaints."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ComplaintSerializer
    
    def get_queryset(self):
        return Complaint.objects.filter(
            user=self.request.user
        ).select_related('commitment', 'commitment__task').order_by('-created_at')


class EvidenceVerificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing evidence verifications.
    Admin actions (approve/reject) would be in admin or separate admin API.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EvidenceVerificationSerializer
    
    def get_queryset(self):
        return EvidenceVerification.objects.filter(
            commitment__task__user=self.request.user
        ).select_related('commitment', 'commitment__task').order_by('-created_at')
