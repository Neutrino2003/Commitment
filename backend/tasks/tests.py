"""
Tasks App Tests

Comprehensive tests for models, serializers, and API endpoints.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta

from .models import Task, TaskList, Tag

User = get_user_model()


class TaskModelTests(TestCase):
    """Test Task model functionality"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.task_list = TaskList.objects.create(
            user=self.user,
            name='Work'
        )

    def test_task_creation(self):
        """Test creating a task"""
        task = Task.objects.create(
            user=self.user,
            task_list=self.task_list,
            title='Test Task',
            priority=3
        )
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.user, self.user)
        self.assertFalse(task.is_completed)

    def test_task_complete_method(self):
        """Test marking task as complete"""
        task = Task.objects.create(
            user=self.user,
            task_list=self.task_list,
            title='Test Task'
        )
        task.complete()
        self.assertTrue(task.is_completed)
        self.assertIsNotNone(task.completed_at)

    def test_task_is_overdue(self):
        """Test overdue detection"""
        past_date = timezone.now() - timedelta(days=1)
        task = Task.objects.create(
            user=self.user,
            task_list=self.task_list,
            title='Overdue Task',
            due_date=past_date
        )
        self.assertTrue(task.is_overdue)


class TaskAPITests(APITestCase):
    """Test Task API endpoints"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.task_list = TaskList.objects.create(
            user=self.user,
            name='Personal'
        )

    def test_create_task(self):
        """Test creating a task via API"""
        data = {
            'title': 'New Task',
            'description': 'Task description',
            'task_list': self.task_list.id,
            'priority': 5
        }
        response = self.client.post('/api/v1/tasks/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(Task.objects.first().title, 'New Task')

    def test_list_tasks(self):
        """Test listing user's tasks"""
        Task.objects.create(
            user=self.user,
            task_list=self.task_list,
            title='Task 1'
        )
        Task.objects.create(
            user=self.user,
            task_list=self.task_list,
            title='Task 2'
        )
        response = self.client.get('/api/v1/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_complete_task_action(self):
        """Test task complete action"""
        task = Task.objects.create(
            user=self.user,
            task_list=self.task_list,
            title='Task to complete'
        )
        url = f'/api/v1/tasks/{task.id}/complete/'
        response = self.client.post(url, {'is_completed': True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertTrue(task.is_completed)

    def test_filter_by_completion(self):
        """Test filtering tasks by completion status"""
        Task.objects.create(
            user=self.user,
            task_list=self.task_list,
            title='Incomplete Task',
            is_completed=False
        )
        Task.objects.create(
            user=self.user,
            task_list=self.task_list,
            title='Completed Task',
            is_completed=True
        )
        response = self.client.get('/api/v1/tasks/?is_completed=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access tasks"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/tasks/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TagModelTests(TestCase):
    """Test Tag model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_tag_creation(self):
        """Test creating a tag"""
        tag = Tag.objects.create(
            user=self.user,
            name='urgent'
        )
        self.assertEqual(str(tag), '#urgent')

    def test_tag_unique_per_user(self):
        """Test that tag names are unique per user"""
        Tag.objects.create(user=self.user, name='work')
        with self.assertRaises(Exception):  # IntegrityError
            Tag.objects.create(user=self.user, name='work')
