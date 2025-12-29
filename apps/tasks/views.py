"""
API Views for Task Management.

This module provides DRF ViewSets and custom endpoints:
- ModelViewSets for CRUD operations
- SyncAPIView for batch data loading
- CalendarAPIView for date range queries with recurring task expansion
- TaskReorderAPIView for drag-and-drop
- CompleteRecurringTaskAPIView for special recurring task completion
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from datetime import datetime

from .models import List, Tag, Task, Habit, HabitLog, TaskAttachment
from .serializers import (
    ListSerializer, TagSerializer, TaskSerializer, TaskTreeSerializer,
    HabitSerializer, HabitLogSerializer, SyncResponseSerializer,
    TaskAttachmentSerializer
)
from .services import RecurrenceService, TaskService, HabitService


class ListViewSet(viewsets.ModelViewSet):
    """
    ViewSet for List CRUD operations.
    Automatically filtered to current user's lists.
    """
    
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [OrderingFilter]
    ordering_fields = ['sort_order', 'created_at', 'name']
    ordering = ['sort_order', 'created_at']
    
    def get_queryset(self):
        """Filter to current user's lists."""
        return List.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Automatically set user on creation."""
        serializer.save(user=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tag CRUD operations.
    """
    
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter to current user's tags."""
        return Tag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Automatically set user on creation."""
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations.
    
    Supports:
    - Filtering by status, priority, list, tags
    - Full-text search on title and notes
    - Ordering by various fields
    - Tree structure queries
    """
    
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'list', 'tags']
    search_fields = ['title', 'notes']
    ordering_fields = ['due_date', 'priority', 'kanban_order', 'created_at']
    ordering = ['kanban_order', 'created_at']
    
    def get_queryset(self):
        """
        Filter to current user's tasks with optimized queries.
        """
        queryset = Task.objects.filter(user=self.request.user)
        queryset = queryset.select_related('list', 'user')
        queryset = queryset.prefetch_related('tags')
        return queryset
    
    def get_serializer_class(self):
        """Use TreeSerializer for tree action."""
        if self.action == 'tree':
            return TaskTreeSerializer
        return TaskSerializer
    
    def perform_create(self, serializer):
        """Automatically set user on creation."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Get tasks in tree structure (roots with nested children).
        Only returns root tasks with all descendants nested.
        """
        # Get root tasks (depth=1) for current user
        root_tasks = self.get_queryset().filter(depth=1)
        serializer = self.get_serializer(root_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete_recurring(self, request, pk=None):
        """
        Special endpoint for completing recurring tasks.
        Automatically calculates next occurrence.
        """
        task = self.get_object()
        updated_task = RecurrenceService.complete_recurring_task(task)
        serializer = self.get_serializer(updated_task)
        return Response(serializer.data)


class HabitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Habit CRUD operations.
    """
    
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['frequency', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['sort_order', 'created_at', 'name']
    ordering = ['sort_order', 'created_at']
    
    def get_queryset(self):
        """Filter to current user's habits."""
        return Habit.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Automatically set user on creation."""
        serializer.save(user=self.request.user)


class HabitLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for HabitLog CRUD operations.
    """
    
    serializer_class = HabitLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['habit', 'date', 'completed']
    ordering_fields = ['date']
    ordering = ['-date']
    
    def get_queryset(self):
        """Filter to current user's habit logs."""
        return HabitLog.objects.filter(habit__user=self.request.user)


class SyncAPIView(APIView):
    """
    Sync endpoint that returns all user data in a single payload.
    
    This reduces API calls for initial app load by returning:
    - All tasks
    - All lists
    - All tags
    - All habits
    
    GET /api/sync/
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return all user data."""
        user = request.user
        
        # Fetch all data for user
        tasks = Task.objects.filter(user=user).select_related('list').prefetch_related('tags')
        lists = List.objects.filter(user=user)
        tags = Tag.objects.filter(user=user)
        habits = Habit.objects.filter(user=user)
        
        # Serialize
        data = {
            'tasks': TaskSerializer(tasks, many=True).data,
            'lists': ListSerializer(lists, many=True).data,
            'tags': TagSerializer(tags, many=True).data,
            'habits': HabitSerializer(habits, many=True).data,
        }
        
        return Response(data)


class CalendarAPIView(APIView):
    """
    Calendar endpoint for date range queries.
    
    Returns all tasks in a date range with recurring tasks expanded.
    
    GET /api/calendar/?start_date=2025-11-01T00:00:00Z&end_date=2025-11-30T23:59:59Z
    
    Query params:
    - start_date: ISO datetime string
    - end_date: ISO datetime string
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return tasks for date range."""
        # Parse date parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if not start_date_str or not end_date_str:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_date = parse_datetime(start_date_str)
            end_date = parse_datetime(end_date_str)
            
            if not start_date or not end_date:
                raise ValueError('Invalid date format')
        except ValueError as e:
            return Response(
                {'error': f'Invalid date format. Use ISO format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get tasks using service (includes expanded recurring instances)
        task_instances = TaskService.get_tasks_by_date_range(
            user=request.user,
            start_date=start_date,
            end_date=end_date,
            include_recurring=True
        )
        
        return Response({
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'tasks': task_instances
        })


class TaskReorderAPIView(APIView):
    """
    Endpoint for bulk task reordering.
    
    Accepts list of task IDs with new order values.
    
    POST /api/tasks/reorder/
    Body: [
        {"id": 1, "order": 1.0},
        {"id": 2, "order": 1.5},
        {"id": 3, "order": 2.0}
    ]
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Bulk update task orders."""
        task_orders = request.data
        
        if not isinstance(task_orders, list):
            return Response(
                {'error': 'Expected list of {id, order} objects'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            TaskService.reorder_tasks(task_orders)
            return Response({'success': True})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class TaskAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TaskAttachment CRUD operations.
    
    Supports:
    - Uploading files to tasks
    - Downloading attachments
    - Deleting attachments
    """
    
    serializer_class = TaskAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['task']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter to attachments for current user's tasks."""
        return TaskAttachment.objects.filter(
            task__user=self.request.user
        ).select_related('task', 'uploaded_by')
    
    def create(self, request, *args, **kwargs):
        """Handle file upload with task validation."""
        task_id = request.data.get('task')
        
        if not task_id:
            return Response(
                {'error': 'task is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user owns the task
        try:
            task = Task.objects.get(id=task_id, user=request.user)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found or you don\'t have permission'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def for_task(self, request):
        """
        Get all attachments for a specific task.
        
        GET /api/task-attachments/for_task/?task_id=123
        """
        task_id = request.query_params.get('task_id')
        
        if not task_id:
            return Response(
                {'error': 'task_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attachments = self.get_queryset().filter(task_id=task_id)
        serializer = self.get_serializer(attachments, many=True)
        return Response(serializer.data)
