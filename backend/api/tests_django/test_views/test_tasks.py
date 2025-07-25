# api/tests_django/test_views/test_tasks.py
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
from django.contrib.auth import get_user_model
from api.models import ApplicationLink, Employee, Skill, Position

User = get_user_model()

class TestPublicApplicantsViewSet(APITestCase):
    def setUp(self):
        self.url = reverse('public-apply-list')
        self.cv_file = SimpleUploadedFile('test_cv.pdf', b'Test PDF content', 'application/pdf')
        self.valid_data = {
            'email': 'test@example.com',
            'phone': '1234567890',
            'distinction_name': 'test-position-2023',
            'cv': self.cv_file
        }
        self.position = Position.objects.create(name='Test Position')
        self.skill = Skill.objects.create(name='Python')
        self.application_link = ApplicationLink.objects.create(
            distinction_name='test-position-2023',
            position=self.position,
            number_remaining_applicants_to_limit=10,
            is_coordinator=False
        )
        self.application_link.skills.add(self.skill)
    
 
    @patch('api.views.upload_to_supabase', return_value="http://example.com/cv.pdf")
    def test_existing_user_application(self, mock_upload):
        User.objects.create_user(username=self.valid_data['email'], password='testpass123')
        response = self.client.post(self.url, data=self.valid_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    @patch('api.views.TogetherCVProcessor.extract_info', return_value={})
    @patch('api.views.upload_to_supabase', return_value="http://example.com/cv.pdf")
    def test_successful_application_submission(self, mock_upload, mock_extract):
        response = self.client.post(self.url, data=self.valid_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('employee_id', response.data)

    @patch('api.views.upload_to_supabase', side_effect=Exception("Duplicate upload"))
    def test_supabase_duplicate_upload(self, mock_upload):
        """Test duplicate upload returns 500 server error"""
        response = self.client.post(
            self.url,
            data=self.valid_data,
            format='multipart'
        )
        # API returns 500 for upload failures
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('detail', response.data)

    @patch('api.views.upload_to_supabase', side_effect=Exception("Upload failed"))
    def test_supabase_upload_failure(self, mock_upload):
        """Test upload failure returns 500 server error"""
        response = self.client.post(
            self.url,
            data=self.valid_data,
            format='multipart'
        )
        # API returns 500 for upload failures
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('detail', response.data)
    def test_missing_required_fields(self):
        invalid_data = {'email': 'test@example.com'}  # Missing required fields
        response = self.client.post(self.url, data=invalid_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    @patch('api.views.upload_to_supabase', return_value="http://example.com/cv.pdf")
    def test_invalid_distinction_name(self, mock_upload):
        invalid_data = self.valid_data.copy()
        invalid_data['distinction_name'] = 'invalid-position'
        response = self.client.post(self.url, data=invalid_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    @patch('api.views.upload_to_supabase', return_value="http://example.com/cv.pdf")
    def test_applicant_limit_reached(self, mock_upload):
        self.application_link.number_remaining_applicants_to_limit = 0
        self.application_link.save()
        response = self.client.post(self.url, data=self.valid_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)