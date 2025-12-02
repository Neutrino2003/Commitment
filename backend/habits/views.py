"""
Habits App Views

Defines ViewSets for habit tracking and statistics.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import filters

from .models import Habit, HabitLog
from .serializers import (
    HabitSerializer, HabitLogSerializer, HabitLogCreateSerializer,
    HabitStatsSerializer
)


class HabitViewSet(viewsets.ModelViewSet):
    """ViewSet for Habit CRUD operations with streak tracking"""
    permission_classes = [IsAuthenticated]
    serializer_class = HabitSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'current_streak', 'best_streak']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return only user's habits"""
        return Habit.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def log(self, request, pk=None):
        """
        Log completion for a specific date.
        Automatically updates streaks.
        """
        habit = self.get_object()
        serializer = HabitLogCreateSerializer(
            data=request.data,
            context={'request': request, 'habit': habit}
        )
        serializer.is_valid(raise_exception=True)
        log = serializer.save()

        return Response(
            HabitLogSerializer(log, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        Get comprehensive statistics for a habit.
        Includes streaks, completion rates, and total completions.
        """
        habit = self.get_object()
        serializer = HabitStatsSerializer(habit)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """
        Get all logs for a habit with optional date filtering.
        """
        habit = self.get_object()
        logs = habit.logs.all()

        # Filter by date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if date_from:
            logs = logs.filter(date__gte=date_from)
        if date_to:
            logs = logs.filter(date__lte=date_to)

        serializer = HabitLogSerializer(logs, many=True, context={'request': request})
        return Response(serializer.data)
