"""
Habits App Serializers

Defines serializers for habit tracking and statistics.
"""
from rest_framework import serializers
from .models import Habit, HabitLog
from datetime import date, timedelta


class HabitSerializer(serializers.ModelSerializer):
    """Serializer for Habit model"""
    current_streak = serializers.IntegerField(read_only=True)
    best_streak = serializers.IntegerField(read_only=True)
    completion_rate = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            'id', 'title', 'description', 'days_of_week',
            'current_streak', 'best_streak', 'completion_rate',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_completion_rate(self, obj):
        """Calculate completion rate for last 30 days"""
        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        # Count active days in the period
        active_days = 0
        completed_days = 0

        current_date = start_date
        while current_date <= end_date:
            day_index = current_date.weekday()
            if obj.is_active_on_day(day_index):
                active_days += 1
                # Check if logged as completed
                if obj.logs.filter(date=current_date, completed=True).exists():
                    completed_days += 1
            current_date += timedelta(days=1)

        if active_days == 0:
            return 0.0
        return round((completed_days / active_days) * 100, 1)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def validate_days_of_week(self, value):
        """Validate days_of_week format"""
        if len(value) != 7:
            raise serializers.ValidationError("days_of_week must be exactly 7 characters")
        if not all(c in '01' for c in value):
            raise serializers.ValidationError("days_of_week must contain only '0' or '1'")
        if value == '0000000':
            raise serializers.ValidationError("At least one day must be active")
        return value


class HabitLogSerializer(serializers.ModelSerializer):
    """Serializer for HabitLog model"""

    class Meta:
        model = HabitLog
        fields = ['id', 'habit', 'date', 'completed', 'notes', 'created_at']
        read_only_fields = ['created_at']

    def validate_habit(self, value):
        """Ensure habit belongs to the user"""
        if value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only log your own habits.")
        return value

    def validate(self, data):
        """Validate that we're not creating duplicate logs"""
        if self.instance is None:  # Creating new log
            habit = data.get('habit')
            log_date = data.get('date')
            if HabitLog.objects.filter(habit=habit, date=log_date).exists():
                raise serializers.ValidationError({
                    'date': f'Log already exists for {log_date}'
                })
        return data


class HabitLogCreateSerializer(serializers.Serializer):
    """Simplified serializer for logging habit completion"""
    date = serializers.DateField(default=date.today)
    completed = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        habit = self.context['habit']
        log_date = validated_data.get('date', date.today())

        # Update or create log
        log, created = HabitLog.objects.update_or_create(
            habit=habit,
            date=log_date,
            defaults={
                'completed': validated_data.get('completed', True),
                'notes': validated_data.get('notes', '')
            }
        )
        return log


class HabitStatsSerializer(serializers.Serializer):
    """Serializer for habit statistics"""
    current_streak = serializers.IntegerField()
    best_streak = serializers.IntegerField()
    total_completions = serializers.IntegerField()
    completion_rate_7_days = serializers.FloatField()
    completion_rate_30_days = serializers.FloatField()
    last_completed = serializers.DateField()

    def to_representation(self, habit):
        """Calculate all stats for a habit"""
        # Get recent logs
        logs_30_days = habit.logs.filter(
            date__gte=date.today() - timedelta(days=30)
        )
        logs_7_days = habit.logs.filter(
            date__gte=date.today() - timedelta(days=7)
        )

        # Calculate completion rates
        def calc_rate(days):
            end_date = date.today()
            start_date = end_date - timedelta(days=days)
            active_days = 0
            completed_days = 0

            current_date = start_date
            while current_date <= end_date:
                day_index = current_date.weekday()
                if habit.is_active_on_day(day_index):
                    active_days += 1
                    if habit.logs.filter(date=current_date, completed=True).exists():
                        completed_days += 1
                current_date += timedelta(days=1)

            return round((completed_days / active_days * 100), 1) if active_days > 0 else 0.0

        # Get last completed date
        last_completed_log = habit.logs.filter(completed=True).first()

        return {
            'current_streak': habit.current_streak,
            'best_streak': habit.best_streak,
            'total_completions': habit.logs.filter(completed=True).count(),
            'completion_rate_7_days': calc_rate(7),
            'completion_rate_30_days': calc_rate(30),
            'last_completed': last_completed_log.date if last_completed_log else None
        }
