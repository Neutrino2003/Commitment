from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Commitment
from .serializers import (
    CommitmentSerializer, CommitmentListSerializer,
    CommitmentDetailSerializer, CommitmentCreateUpdateSerializer,
    ContractMarkCompleteSerializer, ContractMarkFailedSerializer,
)

class CommitmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing habit/commitment contracts"""
    serializer_class = CommitmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'frequency', 'evidence_type', 'leniency']
    search_fields = ['title', 'description']
    ordering_fields = ['-created_at', 'title', 'stake_amount', 'end_time']
    pagination_class = None  # Will be set globally in settings
    
    def get_queryset(self):
        """Filter contracts by current user"""
        return Commitment.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        """Use different serializers based on action"""
        if self.action == 'list':
            return CommitmentListSerializer
        elif self.action == 'retrieve':
            return CommitmentDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CommitmentCreateUpdateSerializer
        elif self.action == 'mark_completed':
            return ContractMarkCompleteSerializer
        elif self.action == 'mark_failed':
            return ContractMarkFailedSerializer
        return CommitmentSerializer
    
    def perform_create(self, serializer):
        """Create contract for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark contract as completed with evidence"""
        contract = self.get_object()
        
        if contract.status in ['completed', 'failed', 'cancelled']:
            return Response(
                {'detail': f'Cannot mark {contract.status} contract as completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        evidence_type = serializer.validated_data.get('evidence_type')
        evidence_data = serializer.validated_data.get('evidence_data')
        
        try:
            contract.mark_completed(evidence_type=evidence_type, evidence_data=evidence_data)
            
            # Create next instance if recurring
            if contract.frequency != 'one_time':
                next_instance = contract.create_next_instance()
                if next_instance:
                    return Response({
                        'detail': 'Contract completed, next instance created',
                        'current': CommitmentDetailSerializer(contract).data,
                        'next': CommitmentDetailSerializer(next_instance).data,
                    }, status=status.HTTP_200_OK)
            
            return Response(
                CommitmentDetailSerializer(contract).data,
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_failed(self, request, pk=None):
        """Mark contract as failed"""
        contract = self.get_object()
        
        if contract.status in ['completed', 'failed', 'cancelled']:
            return Response(
                {'detail': f'Cannot mark {contract.status} contract as failed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reason = serializer.validated_data.get('reason', '')
        
        try:
            contract.mark_failed(reason=reason)
            
            
            # Create next instance if recurring
            if contract.frequency != 'one_time':
                next_instance = contract.create_next_instance()
                if next_instance:
                    return Response({
                        'detail': 'Contract marked as failed, next instance created',
                        'current': CommitmentDetailSerializer(contract).data,
                        'next': CommitmentDetailSerializer(next_instance).data,
                    }, status=status.HTTP_200_OK)
            
            return Response(
                CommitmentDetailSerializer(contract).data,
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a draft contract"""
        contract = self.get_object()
        
        try:
            contract.activate()
            return Response(
                CommitmentDetailSerializer(contract).data,
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause an active contract"""
        contract = self.get_object()
        
        try:
            contract.pause()
            return Response(
                CommitmentDetailSerializer(contract).data,
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused contract"""
        contract = self.get_object()
        
        try:
            contract.resume()
            return Response(
                CommitmentDetailSerializer(contract).data,
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a contract"""
        contract = self.get_object()
        
        try:
            contract.cancel()
            return Response(
                CommitmentDetailSerializer(contract).data,
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def flag_complaint(self, request, pk=None):
        """Flag a complaint on the contract"""
        contract = self.get_object()
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        complaint_text = serializer.validated_data.get('complaint_text', '')
        
        try:
            contract.flag_complaint(complaint_text)
            return Response(
                CommitmentDetailSerializer(contract).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active contracts"""
        contracts = self.get_queryset().filter(status='active')
        serializer = CommitmentListSerializer(contracts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending (active but not completed) contracts"""
        contracts = self.get_queryset().filter(status='active')
        serializer = CommitmentListSerializer(contracts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get all overdue contracts"""
        contracts = self.get_queryset().filter(status='active')
        overdue = [c for c in contracts if c.is_overdue]
        serializer = CommitmentListSerializer(overdue, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Get all completed contracts"""
        contracts = self.get_queryset().filter(status='completed')
        serializer = CommitmentListSerializer(contracts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def failed(self, request):
        """Get all failed contracts"""
        contracts = self.get_queryset().filter(status='failed')
        serializer = CommitmentListSerializer(contracts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get user contract statistics"""
        contracts = self.get_queryset()
        completed = contracts.filter(status='completed')
        on_time = [c for c in completed if c.is_completed_on_time]
        
        return Response({
            'total_contracts': contracts.count(),
            'active_contracts': contracts.filter(status='active').count(),
            'completed_contracts': completed.count(),
            'completed_on_time': len(on_time),
            'failed_contracts': contracts.filter(status='failed').count(),
            'appealed_contracts': contracts.filter(status='appealed').count(),
            'under_review_contracts': contracts.filter(status='under_review').count(),
            'paused_contracts': contracts.filter(status='paused').count(),
            'cancelled_contracts': contracts.filter(status='cancelled').count(),
            'overdue_contracts': sum(1 for c in contracts.filter(status='active') if c.is_overdue),
            'total_stake': sum(c.stake_amount for c in contracts),
        })
