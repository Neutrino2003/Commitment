"""
Comprehensive tests for the commitments app.
Tests commitment lifecycle, recurrence, evidence submission, status transitions, and validation.
"""

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
from decimal import Decimal

from commitments.models import Commitment, Complaint, EvidenceVerification

User = get_user_model()


class CommitmentModelTests(TestCase):
    """Test suite for Commitment model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        
        self.commitment = Commitment.objects.create(
            user=self.user,
            title='Daily Exercise',
            description='Exercise for 30 minutes',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(days=7),
            stake_amount=Decimal('50.00'),
            currency='INR',
            frequency='daily',
            evidence_type='self_verification',
            evidence_required=True
        )
    
    def test_commitment_creation(self):
        """Test commitment is created successfully"""
        self.assertEqual(self.commitment.user, self.user)
        self.assertEqual(self.commitment.title, 'Daily Exercise')
        self.assertEqual(self.commitment.status, 'draft')
        self.assertEqual(self.commitment.stake_amount, Decimal('50.00'))
    
    def test_commitment_activation(self):
        """Test commitment can be activated from draft"""
        self.commitment.activate()
        self.assertEqual(self.commitment.status, 'active')
        self.assertIsNotNone(self.commitment.activated_at)
    
    def test_commitment_cannot_activate_with_past_deadline(self):
        """Test commitment cannot be activated if deadline is in the past"""
        self.commitment.end_time = timezone.now() - timedelta(days=1)
        self.commitment.save()
        
        with self.assertRaises(ValueError):
            self.commitment.activate()
    
    def test_commitment_is_active_property(self):
        """Test is_active property works correctly"""
        self.assertFalse(self.commitment.is_active)
        
        self.commitment.activate()
        self.assertTrue(self.commitment.is_active)
    
    def test_commitment_is_overdue_property(self):
        """Test is_overdue property works correctly"""
        self.commitment.activate()
        self.assertFalse(self.commitment.is_overdue)
        
        # Set end_time to past
        self.commitment.end_time = timezone.now() - timedelta(hours=1)
        self.commitment.save()
        self.assertTrue(self.commitment.is_overdue)
    
    def test_commitment_time_remaining(self):
        """Test time_remaining calculation"""
        self.commitment.activate()
        time_remaining = self.commitment.time_remaining
        self.assertIsNotNone(time_remaining)
        self.assertGreater(time_remaining, timedelta(0))
    
    def test_commitment_pause_and_resume(self):
        """Test commitment can be paused and resumed"""
        self.commitment.activate()
        
        self.commitment.pause()
        self.assertEqual(self.commitment.status, 'paused')
        
        self.commitment.resume()
        self.assertEqual(self.commitment.status, 'active')
    
    def test_commitment_cancel(self):
        """Test commitment can be cancelled"""
        self.commitment.activate()
        self.commitment.cancel()
        self.assertEqual(self.commitment.status, 'cancelled')
    
    def test_commitment_cannot_cancel_completed(self):
        """Test completed commitment cannot be cancelled"""
        self.commitment.activate()
        self.commitment.mark_completed()
        
        with self.assertRaises(ValueError):
            self.commitment.cancel()


class CommitmentRecurrenceTests(TestCase):
    """Test suite for commitment recurrence functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
    
    def test_daily_recurrence(self):
        """Test daily recurrence creates next instance correctly"""
        start = timezone.now()
        end = start + timedelta(hours=23)
        
        commitment = Commitment.objects.create(
            user=self.user,
            title='Daily Task',
            description='Test',
            start_time=start,
            end_time=end,
            stake_amount=Decimal('10.00'),
            frequency='daily'
        )
        
        next_instance = commitment.create_next_instance()
        self.assertIsNotNone(next_instance)
        self.assertEqual(next_instance.start_time.date(), (start + timedelta(days=1)).date())
        self.assertEqual(next_instance.status, 'active')
        self.assertIsNotNone(next_instance.activated_at)
    
    def test_weekly_recurrence(self):
        """Test weekly recurrence creates next instance correctly"""
        start = timezone.now()
        end = start + timedelta(days=6)
        
        commitment = Commitment.objects.create(
            user=self.user,
            title='Weekly Task',
            description='Test',
            start_time=start,
            end_time=end,
            stake_amount=Decimal('10.00'),
            frequency='weekly'
        )
        
        next_instance = commitment.create_next_instance()
        self.assertIsNotNone(next_instance)
        self.assertEqual(next_instance.start_time.date(), (start + timedelta(weeks=1)).date())
    
    def test_monthly_recurrence(self):
        """Test monthly recurrence handles edge cases correctly (e.g., Jan 31 -> Feb 28/29)"""
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        
        # Create a commitment on Jan 31
        start = datetime(2024, 1, 31, 12, 0, tzinfo=timezone.get_current_timezone())
        end = start + timedelta(days=1)
        
        commitment = Commitment.objects.create(
            user=self.user,
            title='Monthly Task',
            description='Test',
            start_time=start,
            end_time=end,
            stake_amount=Decimal('10.00'),
            frequency='monthly'
        )
        
        next_instance = commitment.create_next_instance()
        self.assertIsNotNone(next_instance)
        
        # Should be Feb 29, 2024 (leap year)
        expected_date = datetime(2024, 2, 29, 12, 0, tzinfo=timezone.get_current_timezone())
        self.assertEqual(next_instance.start_time, expected_date)
    
    def test_one_time_no_recurrence(self):
        """Test one-time commitments don't create next instances"""
        commitment = Commitment.objects.create(
            user=self.user,
            title='One-time Task',
            description='Test',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(days=1),
            stake_amount=Decimal('10.00'),
            frequency='one_time'
        )
        
        next_instance = commitment.create_next_instance()
        self.assertIsNone(next_instance)


class CommitmentEvidenceTests(TestCase):
    """Test suite for evidence submission and verification"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        
        self.commitment = Commitment.objects.create(
            user=self.user,
            title='Test Commitment',
            description='Test',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(days=1),
            stake_amount=Decimal('50.00'),
            evidence_type='photo',
            evidence_required=True,
            status='active',
            activated_at=timezone.now()
        )
    
    def test_submit_evidence_self_verification(self):
        """Test evidence submission for self-verification type"""
        self.commitment.evidence_type = 'self_verification'
        self.commitment.save()
        
        self.commitment.submit_evidence(
            evidence_type='self_verification',
            evidence_text='Completed the task'
        )
        
        self.assertTrue(self.commitment.evidence_submitted)
        self.assertIsNotNone(self.commitment.evidence_submitted_at)
        # Self-verification doesn't change status to under_review
        self.assertEqual(self.commitment.status, 'active')
    
    def test_submit_evidence_photo(self):
        """Test evidence submission for photo/video types transitions to under_review"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Create a fake image file
        fake_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'fake image content',
            content_type='image/jpeg'
        )
        
        self.commitment.submit_evidence(
            evidence_type='photo',
            evidence_data=fake_image,
            evidence_text='Photo evidence'
        )
        
        self.assertTrue(self.commitment.evidence_submitted)
        self.assertEqual(self.commitment.status, 'under_review')
    
    def test_cannot_submit_evidence_after_deadline(self):
        """Test evidence cannot be submitted after deadline"""
        self.commitment.end_time = timezone.now() - timedelta(hours=1)
        self.commitment.save()
        
        with self.assertRaises(ValueError):
            self.commitment.submit_evidence(
                evidence_type='photo',
                evidence_text='Late submission'
            )
    
    def test_mark_completed_self_verification(self):
        """Test marking commitment as completed with self-verification"""
        self.commitment.evidence_type = 'self_verification'
        self.commitment.save()
        
        self.commitment.mark_completed()
        self.assertEqual(self.commitment.status, 'completed')
        self.assertIsNotNone(self.commitment.completed_at)
    
    def test_is_completed_on_time(self):
        """Test is_completed_on_time property"""
        self.commitment.evidence_type = 'self_verification'
        self.commitment.save()
        
        # Complete before deadline
        self.commitment.mark_completed()
        self.assertTrue(self.commitment.is_completed_on_time)
        
        # Simulate late completion
        self.commitment.completed_at = self.commitment.end_time + timedelta(hours=1)
        self.assertEqual(self.commitment.is_completed_on_time, False)


class CommitmentStatusTests(TestCase):
    """Test suite for commitment status transitions"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        
        self.commitment = Commitment.objects.create(
            user=self.user,
            title='Test Commitment',
            description='Test',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(days=1),
            stake_amount=Decimal('50.00'),
            status='active',
            activated_at=timezone.now()
        )
    
    def test_mark_failed(self):
        """Test marking commitment as failed"""
        self.commitment.mark_failed(reason='User failed to complete')
        self.assertEqual(self.commitment.status, 'failed')
        self.assertIsNotNone(self.commitment.completed_at)
    
    def test_auto_fail_if_overdue(self):
        """Test auto-fail mechanism for overdue commitments"""
        # Set end_time to past
        self.commitment.end_time = timezone.now() - timedelta(hours=1)
        self.commitment.save()
        
        result = self.commitment.auto_fail_if_overdue()
        self.assertTrue(result)
        self.assertEqual(self.commitment.status, 'failed')
    
    def test_auto_fail_does_not_trigger_if_evidence_submitted(self):
        """Test auto-fail doesn't trigger if evidence was submitted"""
        self.commitment.end_time = timezone.now() - timedelta(hours=1)
        self.commitment.evidence_submitted = True
        self.commitment.save()
        
        result = self.commitment.auto_fail_if_overdue()
        self.assertFalse(result)
        self.assertEqual(self.commitment.status, 'active')


class CommitmentAPITests(APITestCase):
    """Test suite for Commitment API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        
        # Authenticate
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')
        
        self.list_url = reverse('commitment-list')
    
    def test_create_commitment(self):
        """Test creating a new commitment via API"""
        data = {
            'title': 'Daily Exercise',
            'description': 'Exercise for 30 minutes daily',
            'start_time': (timezone.now() + timedelta(hours=1)).isoformat(),
            'end_time': (timezone.now() + timedelta(days=7)).isoformat(),
            'stake_amount': '50.00',
            'currency': 'INR',
            'frequency': 'daily',
            'evidence_type': 'self_verification',
            'evidence_required': True
        }
        
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Daily Exercise')
        self.assertEqual(response.data['status'], 'draft')
    
    def test_list_user_commitments(self):
        """Test listing user's own commitments"""
        # Create a few commitments
        for i in range(3):
            Commitment.objects.create(
                user=self.user,
                title=f'Task {i}',
                description='Test',
                start_time=timezone.now(),
                end_time=timezone.now() + timedelta(days=1),
                stake_amount=Decimal('10.00')
            )
        
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
    
    def test_unauthenticated_user_cannot_create_commitment(self):
        """Test unauthenticated user cannot create commitments"""
        self.client.credentials()  # Remove authentication
        
        data = {
            'title': 'Test',
            'description': 'Test',
            'start_time': timezone.now().isoformat(),
            'end_time': (timezone.now() + timedelta(days=1)).isoformat(),
            'stake_amount': '10.00'
        }
        
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ComplaintModelTests(TestCase):
    """Test suite for Complaint model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        
        self.commitment = Commitment.objects.create(
            user=self.user,
            title='Test Commitment',
            description='Test',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(days=1),
            stake_amount=Decimal('50.00'),
            status='failed'
        )
        
        self.complaint = Complaint.objects.create(
            user=self.user,
            commitment=self.commitment,
            reason_category='emergency',
            description='Had a medical emergency'
        )
    
    def test_complaint_creation(self):
        """Test complaint is created successfully"""
        self.assertEqual(self.complaint.user, self.user)
        self.assertEqual(self.complaint.commitment, self.commitment)
        self.assertEqual(self.complaint.status, 'pending')
    
    def test_approve_complaint(self):
        """Test approving a complaint"""
        admin = User.objects.create_user(username='admin', email='admin@example.com', is_staff=True)
        
        self.complaint.approve(
            reviewed_by=admin,
            review_notes='Approved due to medical emergency',
            refund_amount=Decimal('50.00')
        )
        
        self.assertEqual(self.complaint.status, 'approved')
        self.assertEqual(self.complaint.refund_amount, Decimal('50.00'))
        self.assertIsNotNone(self.complaint.reviewed_at)
        self.assertEqual(self.commitment.status, 'appealed')
    
    def test_reject_complaint(self):
        """Test rejecting a complaint"""
        admin = User.objects.create_user(username='admin', email='admin@example.com', is_staff=True)
        
        self.complaint.reject(
            reviewed_by=admin,
            review_notes='Insufficient evidence'
        )
        
        self.assertEqual(self.complaint.status, 'rejected')
        self.assertIsNotNone(self.complaint.reviewed_at)
