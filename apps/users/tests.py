"""
Tests for Users app.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTest(TestCase):
    """Test User model."""

    def test_user_creation(self):
        """Test creating a user."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.timezone, 'UTC')  # default

    def test_user_str(self):
        """Test user string representation."""
        user = User.objects.create_user(username='testuser')
        self.assertEqual(str(user), 'testuser')