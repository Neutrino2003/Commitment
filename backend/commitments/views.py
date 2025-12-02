from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Commitment, Complaint, EvidenceVerification
from .serializers import (
    CommitmentSerializer, CommitmentListSerializer,
    CommitmentDetailSerializer, CommitmentCreateUpdateSerializer,
    ContractMarkCompleteSerializer, ContractMarkFailedSerializer,
    ComplaintSerializer, ComplaintListSerializer, ComplaintCreateSerializer,
    ComplaintReviewSerializer, EvidenceVerificationSerializer,
    EvidenceVerificationListSerializer, EvidenceVerificationActionSerializer,
    PaidCommitmentSerializer, PaidCommitmentStatsSerializer,  # Added paid commitment serializers
)
from .tasks import send_commitment_notification



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
    
    def retrieve(self, request, *args, **kwargs):
        """Get commitment details and auto-activate if within timeframe"""
        instance = self.get_object()
        
        # Auto-activate draft commitments if start_time has arrived
        now = timezone.now()
        if (instance.status == 'draft' and 
            instance.start_time <= now and 
            instance.end_time > now):
            try:
                instance.activate()
            except ValueError:
                pass  # Already active or invalid state
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def list(self, request, *args, **kwargs):
        """List commitments and auto-activate any draft commitments within timeframe"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Auto-activate draft commitments if start_time has arrived
        now = timezone.now()
        draft_commitments = queryset.filter(
            status='draft',
            start_time__lte=now,
            end_time__gt=now
        )
        
        for commitment in draft_commitments:
            try:
                commitment.activate()
            except ValueError:
                pass  # Already active or invalid state
        
        # Refresh queryset after potential activations
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
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
        """Create contract for current user and auto-activate if start_time is now or past"""
        commitment = serializer.save(user=self.request.user)
        
        # Auto-activate if start_time is now or in the past
        if commitment.start_time <= timezone.now() and commitment.end_time > timezone.now():
            commitment.status = 'active'
            commitment.activated_at = timezone.now()
            commitment.save()
        
        return commitment
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark commitment as completed - delegates to CommitmentService"""
        contract = self.get_object()
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to service layer
            from .services import CommitmentService
            
            commitment, next_instance = CommitmentService.complete_commitment(
                commitment=contract,
                completed_by=request.user,
                evidence_type=serializer.validated_data.get('evidence_type'),
                evidence_file=serializer.validated_data.get('evidence_file'),
                evidence_text=serializer.validated_data.get('evidence_text', '')
            )
            
            # Build response
            response_data = {
                'commitment': CommitmentDetailSerializer(commitment).data
            }
            
            if commitment.status == 'completed':
                if next_instance:
                    response_data['detail'] = 'Commitment completed! Next instance created.'
                    response_data['next'] = CommitmentDetailSerializer(next_instance).data
                else:
                    response_data['detail'] = 'Commitment completed successfully!'
            else:
                response_data['detail'] = 'Evidence submitted successfully. Awaiting admin verification.'
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_failed(self, request, pk=None):
        """Mark contract as failed - delegates to CommitmentService"""
        contract = self.get_object()
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to service layer
            from .services import CommitmentService
            
            commitment, next_instance = CommitmentService.mark_commitment_failed(
                commitment=contract,
                failed_by=request.user,
                reason=serializer.validated_data.get('reason', '')
            )
            
            # Build response
            if next_instance:
                return Response({
                    'detail': 'Commitment marked as failed. Next instance created.',
                    'current': CommitmentDetailSerializer(commitment).data,
                    'next': CommitmentDetailSerializer(next_instance).data,
                }, status=status.HTTP_200_OK)
            
            return Response({
                'detail': 'Commitment marked as failed.',
                'commitment': CommitmentDetailSerializer(commitment).data
            }, status=status.HTTP_200_OK)
            
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


class ComplaintViewSet(viewsets.ModelViewSet):
    """ViewSet for managing complaints about failed commitments"""
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'reason_category', 'commitment']
    search_fields = ['description', 'review_notes']
    ordering_fields = ['-created_at', 'reviewed_at', 'status']
    
    def get_queryset(self):
        """Filter complaints by current user (or all if admin)"""
        if self.request.user.is_staff:
            return Complaint.objects.all().select_related('user', 'commitment', 'reviewed_by')
        return Complaint.objects.filter(user=self.request.user).select_related('commitment', 'reviewed_by')
    
    def get_serializer_class(self):
        """Use different serializers based on action"""
        if self.action == 'list':
            return ComplaintListSerializer
        elif self.action == 'create':
            return ComplaintCreateSerializer
        elif self.action in ['review', 'process_refund']:
            return ComplaintReviewSerializer
        return ComplaintSerializer
    
    def get_permissions(self):
        """Admin-only actions require IsAdminUser"""
        if self.action in ['review', 'process_refund', 'admin_pending', 'admin_statistics']:
            return [IsAdminUser()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Create complaint - delegates to ComplaintService"""
        from .services import ComplaintService
        
        complaint = ComplaintService.create_complaint(
            user=self.request.user,
            commitment=serializer.validated_data['commitment'],
            reason_category=serializer.validated_data['reason_category'],
            description=serializer.validated_data['description'],
            evidence_file=serializer.validated_data.get('evidence_file')
        )
        
        return complaint
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def review(self, request, pk=None):
        """Admin endpoint to approve or reject complaint - delegates to ComplaintService"""
        complaint = self.get_object()
        
        if complaint.is_resolved:
            return Response(
                {'detail': f'Complaint already {complaint.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data, context={'complaint': complaint})
        serializer.is_valid(raise_exception=True)
        
        action = serializer.validated_data['action']
        review_notes = serializer.validated_data.get('review_notes', '')
        refund_amount = serializer.validated_data.get('refund_amount')
        
        try:
            from .services import ComplaintService
            
            if action == 'approve':
                complaint = ComplaintService.approve_complaint(
                    complaint=complaint,
                    reviewed_by=request.user,
                    review_notes=review_notes,
                    refund_amount=refund_amount
                )
                message = f'Complaint approved. Refund of {complaint.refund_amount} {complaint.commitment.currency} will be processed.'
            else:  # reject
                complaint = ComplaintService.reject_complaint(
                    complaint=complaint,
                    reviewed_by=request.user,
                    review_notes=review_notes
                )
                message = f'Complaint rejected. Reason: {review_notes}'
            
            return Response({
                'detail': message,
                'complaint': ComplaintSerializer(complaint).data
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def process_refund(self, request, pk=None):
        """Admin endpoint to mark refund as processed"""
        complaint = self.get_object()
        
        try:
            complaint.process_refund()
            
            # TODO: Integrate with payment gateway to actually process refund
            
            return Response({
                'detail': 'Refund marked as processed',
                'complaint': ComplaintSerializer(complaint).data
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_complaints(self, request):
        """Get all complaints filed by the current user"""
        complaints = self.get_queryset().filter(user=request.user)
        serializer = ComplaintListSerializer(complaints, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending complaints for current user"""
        complaints = self.get_queryset().filter(user=request.user, status='pending')
        serializer = ComplaintListSerializer(complaints, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def resolved(self, request):
        """Get all resolved complaints (approved/rejected) for current user"""
        complaints = self.get_queryset().filter(
            user=request.user,
            status__in=['approved', 'rejected']
        )
        serializer = ComplaintListSerializer(complaints, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def admin_pending(self, request):
        """Admin endpoint: Get all pending complaints"""
        complaints = Complaint.objects.filter(status='pending').select_related('user', 'commitment')
        serializer = ComplaintListSerializer(complaints, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def admin_statistics(self, request):
        """Admin endpoint: Get complaint statistics"""
        all_complaints = Complaint.objects.all()
        
        return Response({
            'total_complaints': all_complaints.count(),
            'pending_complaints': all_complaints.filter(status='pending').count(),
            'under_review_complaints': all_complaints.filter(status='under_review').count(),
            'approved_complaints': all_complaints.filter(status='approved').count(),
            'rejected_complaints': all_complaints.filter(status='rejected').count(),
            'total_refund_amount': sum(
                c.refund_amount for c in all_complaints.filter(status='approved')
                if c.refund_amount
            ),
            'refunds_processed': all_complaints.filter(refund_processed=True).count(),
            'refunds_pending': all_complaints.filter(
                status='approved',
                refund_processed=False
            ).count(),
        })


class EvidenceVerificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing evidence verification (admin-only)"""
    serializer_class = EvidenceVerificationSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'commitment__user', 'commitment__evidence_type']
    search_fields = ['notes', 'commitment__title', 'commitment__user__username']
    ordering_fields = ['-created_at', 'verified_at', 'status']
    
    def get_queryset(self):
        """Get all evidence verifications"""
        return EvidenceVerification.objects.all().select_related(
            'commitment', 'commitment__user', 'verified_by'
        )
    
    def get_serializer_class(self):
        """Use different serializers based on action"""
        if self.action == 'list':
            return EvidenceVerificationListSerializer
        elif self.action == 'verify':
            return EvidenceVerificationActionSerializer
        return EvidenceVerificationSerializer
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Admin endpoint to verify evidence - delegates to EvidenceVerificationService"""
        verification = self.get_object()
        
        if not verification.is_pending:
            return Response(
                {'detail': f'Evidence already {verification.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            from .services import EvidenceVerificationService
            
            if action == 'approve':
                verification = EvidenceVerificationService.approve_evidence(
                    verification=verification,
                    verified_by=request.user,
                    notes=notes
                )
                message = 'Evidence approved. Commitment marked as completed.'
            
            elif action == 'reject':
                verification = EvidenceVerificationService.reject_evidence(
                    verification=verification,
                    verified_by=request.user,
                    notes=notes
                )
                message = 'Evidence rejected. Commitment marked as failed.'
            
            else:  # request_more_info
                verification = EvidenceVerificationService.request_more_info(
                    verification=verification,
                    verified_by=request.user,
                    notes=notes
                )
                message = 'More information requested from user.'
            
            return Response({
                'detail': message,
                'verification': EvidenceVerificationSerializer(verification).data
            }, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending evidence verifications"""
        verifications = self.get_queryset().filter(status='pending')
        serializer = EvidenceVerificationListSerializer(verifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get evidence verification statistics"""
        all_verifications = self.get_queryset()
        
        return Response({
            'total_verifications': all_verifications.count(),
            'pending_verifications': all_verifications.filter(status='pending').count(),
            'approved_verifications': all_verifications.filter(status='approved').count(),
            'rejected_verifications': all_verifications.filter(status='rejected').count(),
            'needs_more_info': all_verifications.filter(status='needs_more_info').count(),
        })


class PaidCommitmentsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for paid (money-based) commitments - Read-only with stats endpoint"""
    serializer_class = PaidCommitmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'description']
    ordering_fields = ['-created_at', 'stake_amount', 'end_time']
    
    def get_queryset(self):
        """Get only paid (money-type) commitments for current user"""
        return Commitment.objects.filter(
            user=self.request.user,
            stake_type='money'
        ).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get paid commitments statistics"""
        serializer = PaidCommitmentStatsSerializer()
        stats = serializer.to_representation(request.user)
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active paid commitments"""
        commitments = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(commitments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get completed and failed paid commitments"""
        commitments = self.get_queryset().filter(
            status__in=['completed', 'failed']
        )
        serializer = self.get_serializer(commitments, many=True)
        return Response(serializer.data)

