"""
Tasks App Views

Defines ViewSets for RESTful API endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Task, TaskList, Tag
from .serializers import (
    TaskSerializer, TaskCreateUpdateSerializer, TaskCompleteSerializer,
    TaskBoostSerializer, TaskListSerializer, TagSerializer
)


class TaskListViewSet(viewsets.ModelViewSet):
    """ViewSet for TaskList CRUD operations"""
    permission_classes = [IsAuthenticated]
    serializer_class = TaskListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Return only user's task lists"""
        return TaskList.objects.filter(user=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    """ViewSet for Tag CRUD operations"""
    permission_classes = [IsAuthenticated]
    serializer_class = TagSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Return only user's tags"""
        return Tag.objects.filter(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task CRUD operations with custom actions"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['task_list', 'is_completed', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return only user's tasks"""
        queryset = Task.objects.filter(user=self.request.user).select_related(
            'task_list'
        ).prefetch_related('tags', 'subtasks')

        # Filter by tags if provided
        tag_ids = self.request.query_params.get('tags', None)
        if tag_ids:
            tag_id_list = [int(x) for x in tag_ids.split(',')]
            queryset = queryset.filter(tags__id__in=tag_id_list).distinct()

        # Filter by date range
        due_date_from = self.request.query_params.get('due_date_from', None)
        due_date_to = self.request.query_params.get('due_date_to', None)
        if due_date_from:
            queryset = queryset.filter(due_date__gte=due_date_from)
        if due_date_to:
            queryset = queryset.filter(due_date__lte=due_date_to)

        # Filter overdue tasks
        if self.request.query_params.get('overdue', '').lower() == 'true':
            from django.utils import timezone
            queryset = queryset.filter(
                is_completed=False,
                due_date__lt=timezone.now()
            )

        return queryset

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['create', 'update', 'partial_update']:
            return TaskCreateUpdateSerializer
        return TaskSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark task as complete or incomplete"""
        task = self.get_object()
        serializer = TaskCompleteSerializer(
            task,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            TaskSerializer(task, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def boost(self, request, pk=None):
        """
        Convert task to a commitment (the "boost" feature).
        Creates a linked Commitment with stakes.
        """
        task = self.get_object()

        serializer = TaskBoostSerializer(
            data=request.data,
            context={'request': request, 'task': task}
        )
        serializer.is_valid(raise_exception=True)
        commitment = serializer.save()

        from commitments.serializers import CommitmentListSerializer
        return Response(
            CommitmentListSerializer(commitment, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
