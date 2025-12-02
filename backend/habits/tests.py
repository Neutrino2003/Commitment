"""
Habits App Tests

Comprehensive tests for habit tracking and streak calculation.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date, timedelta

from .models import Habit, HabitLog

User = get_user_model()


class HabitModelTests(TestCase):
    """Test Habit model functionality"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_habit_creation(self):
        """Test creating a habit"""
        habit = Habit.objects.create(
            user=self.user,
            title='Daily Exercise',
            days_of_week='1111111'  # Every day
        )
        self.assertEqual(habit.title, 'Daily Exercise')
        self.assertEqual(habit.current_streak, 0)
        self.assertEqual(habit.best_streak, 0)

    def test_is_active_on_day(self):
        """Test checking if habit is active on specific day"""
        habit = Habit.objects.create(
            user=self.user,
            title='Weekday Task',
            days_of_week='1111100'  # Mon-Fri only
        )
        self.assertTrue(habit.is_active_on_day(0))  # Monday
        self.assertTrue(habit.is_active_on_day(4))  # Friday
        self.assertFalse(habit.is_active_on_day(5))  # Saturday
        self.assertFalse(habit.is_active_on_day(6))  # Sunday

    def test_streak_calculation(self):
        """Test streak calculation with logs"""
        habit = Habit.objects.create(
            user=self.user,
            title='Daily Reading',
            days_of_week='1111111'
        )

        # Create logs for past 3 days
        today = date.today()
        for i in range(3):
            log_date = today - timedelta(days=i)
            HabitLog.objects.create(
                habit=habit,
                date=log_date,
                completed=True
            )

        # Streak should be 3
        streak = habit.calculate_streak()
        self.assertEqual(streak, 3)

    def test_streak_broken(self):
        """Test that missing a day breaks the streak"""
        habit = Habit.objects.create(
            user=self.user,
            title='Daily Task',
            days_of_week='1111111'
        )

        today = date.today()
        # Log today and yesterday
        HabitLog.objects.create(habit=habit, date=today, completed=True)
        # Skip day before yesterday
        # Log 3 days ago
        HabitLog.objects.create(
            habit=habit,
            date=today - timedelta(days=3),
            completed=True
        )

        streak = habit.calculate_streak()
        # Streak should only be 1 (today) because yesterday is missing
        self.assertEqual(streak, 1)

    def test_best_streak_updated(self):
        """Test that best streak is updated"""
        habit = Habit.objects.create(
            user=self.user,
            title='Exercise',
            days_of_week='1111111'
        )

        # Create a 5-day streak
        today = date.today()
        for i in range(5):
            log_date = today - timedelta(days=i)
            HabitLog.objects.create(habit=habit, date=log_date, completed=True)

        habit.update_streak()
        self.assertEqual(habit.current_streak, 5)
        self.assertEqual(habit.best_streak, 5)


class HabitLogTests(TestCase):
    """Test HabitLog model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.habit = Habit.objects.create(
            user=self.user,
            title='Daily Task'
        )

    def test_log_creation(self):
        """Test creating a habit log"""
        log = HabitLog.objects.create(
            habit=self.habit,
            date=date.today(),
            completed=True
        )
        self.assertEqual(log.habit, self.habit)
        self.assertTrue(log.completed)

    def test_log_unique_per_day(self):
        """Test that only one log per day is allowed"""
        log_date = date.today()
        HabitLog.objects.create(habit=self.habit, date=log_date, completed=True)
        
        with self.assertRaises(Exception):  # IntegrityError
            HabitLog.objects.create(habit=self.habit, date=log_date, completed=True)


class HabitAPITests(APITestCase):
    """Test Habit API endpoints"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_habit(self):
        """Test creating a habit via API"""
        data = {
            'title': 'Morning Run',
            'description': 'Run for 30 minutes',
            'days_of_week': '1010100'  # Mon, Wed, Fri
        }
        response = self.client.post('/api/v1/habits/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Habit.objects.count(), 1)

    def test_list_habits(self):
        """Test listing user's habits"""
        Habit.objects.create(user=self.user, title='Habit 1')
        Habit.objects.create(user=self.user, title='Habit 2')
        
        response = self.client.get('/api/v1/habits/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_log_habit_completion(self):
        """Test logging habit completion"""
        habit = Habit.objects.create(user=self.user, title='Exercise')
        
        url = f'/api/v1/habits/{habit.id}/log/'
        data = {'date': date.today().isoformat(), 'completed': True}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(HabitLog.objects.count(), 1)

    def test_get_habit_stats(self):
        """Test getting habit statistics"""
        habit = Habit.objects.create(user=self.user, title='Reading')
        
        # Create some logs
        today = date.today()
        for i in range(3):
            HabitLog.objects.create(
                habit=habit,
                date=today - timedelta(days=i),
                completed=True
            )
        
        url = f'/api/v1/habits/{habit.id}/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('current_streak', response.data)
        self.assertIn('best_streak', response.data)
        self.assertIn('total_completions', response.data)

    def test_invalid_days_of_week(self):
        """Test that invalid days_of_week format is rejected"""
        data = {
            'title': 'Bad Habit',
            'days_of_week': '123'  # Too short
        }
        response = self.client.post('/api/v1/habits/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
