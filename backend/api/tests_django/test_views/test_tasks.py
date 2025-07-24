# tests/test_tasks.py
import io
import uuid
from unittest.mock import MagicMock, patch
from supabase import ClientException

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import ApplicationLink, EducationDegree, EducationField, Employee, Region, Skill, Position

User = get_user_model()

@patch('api.supabase_utils.upload_to_supabase')
@patch('api.models.Employee.objects.create')
@patch('django.contrib.auth.models.User.objects.create_user')
class TestPublicApplicantsViewSet(APITestCase):

    def setUp(self):
        # Create test data
        self.position = Position.objects.create(name="Software Engineer")
        self.skill1 = Skill.objects.create(name="Python")
        self.skill2 = Skill.objects.create(name="Django")
        self.region = Region.objects.create(
            name="Remote",
            distance_to_work=10,
            allowed_radius_meters=100
        )
        self.degree = EducationDegree.objects.create(name="Bachelor's")
        self.field = EducationField.objects.create(name="Computer Science")

        self.application_link = ApplicationLink.objects.create(
            distinction_name="test-link-developer",
            position=self.position,
            is_coordinator=False,
            number_remaining_applicants_to_limit=10
        )
        self.application_link.skills.add(self.skill1, self.skill2)

        self.list_url = reverse('public-apply-list')

        # Mock CV processor
        self.mock_processor_patcher = patch('api.cv_processing.LLM_utils.TogetherCVProcessor')
        self.mock_processor = self.mock_processor_patcher.start()
        self.mock_processor_instance = MagicMock()
        self.mock_processor.return_value = self.mock_processor_instance
        self.mock_processor_instance.extract_info.return_value = {
            "skills": ["Python", "Django", "SQL"],
            "region": self.region.name,
            "degree": self.degree.name,
            "field": self.field.name,
            "experience": 3,
            "had_leadership": True,
            "has_position_related_high_education": True,
        }

    def tearDown(self):
        self.mock_processor_patcher.stop()

    def generate_unique_filename(self):
        return f"test_cv_{uuid.uuid4().hex}.pdf"

    def test_successful_application_submission(self, mock_create_user, mock_create_employee, mock_upload_to_supabase):
        """Test successful application with CV upload and processing"""
        # Configure mocks
        unique_filename = self.generate_unique_filename()
        mock_upload_to_supabase.return_value = f"http://example.com/{unique_filename}"
        
        mock_user = MagicMock()
        mock_user.username = 'testuser@example.com'
        mock_create_user.return_value = mock_user
        
        mock_employee = MagicMock()
        mock_employee.user = mock_user
        mock_create_employee.return_value = mock_employee

        # Test data
        cv_content = b"This is a mock CV content."
        cv_file = io.BytesIO(cv_content)
        cv_file.name = unique_filename

        data = {
            'email': 'testuser@example.com',
            'phone': '1234567890',
            'distinction_name': 'test-link-developer',
            'cv': cv_file,
        }

        response = self.client.post(self.list_url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("Application submitted successfully", response.data['detail'])
        self.assertTrue(response.data['llm_success'])
        
        mock_upload_to_supabase.assert_called_once()
        self.mock_processor_instance.extract_info.assert_called_once()

    def test_cv_processing_failure(self, mock_create_user, mock_create_employee, mock_upload_to_supabase):
        """Test application when CV processing fails"""
        # Configure mocks
        unique_filename = self.generate_unique_filename()
        mock_upload_to_supabase.return_value = f"http://example.com/{unique_filename}"
        
        mock_user = MagicMock()
        mock_user.username = 'llm_fail@example.com'
        mock_create_user.return_value = mock_user
        
        mock_employee = MagicMock()
        mock_employee.user = mock_user
        mock_create_employee.return_value = mock_employee

        # Force processing failure
        self.mock_processor_instance.extract_info.side_effect = Exception("LLM processing error")

        # Test data
        cv_content = b"This is a mock CV content."
        cv_file = io.BytesIO(cv_content)
        cv_file.name = unique_filename

        data = {
            'email': 'llm_fail@example.com',
            'phone': '1234567890',
            'distinction_name': 'test-link-developer',
            'cv': cv_file,
        }

        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("CV parsing failed", response.data['detail'])
        self.assertFalse(response.data['llm_success'])

    def test_supabase_upload_failure(self, mock_create_user, mock_create_employee, mock_upload_to_supabase):
        """Test application when Supabase upload fails"""
        # Configure upload failure
        unique_filename = self.generate_unique_filename()
        mock_upload_to_supabase.side_effect = ClientException(
            message="Storage error",
            code=500,
            response=MagicMock(status_code=500))
        
        mock_user = MagicMock()
        mock_user.username = 'upload_fail@example.com'
        mock_create_user.return_value = mock_user
        
        mock_employee = MagicMock()
        mock_employee.user = mock_user
        mock_create_employee.return_value = mock_employee

        # Test data
        cv_content = b"This is a mock CV content."
        cv_file = io.BytesIO(cv_content)
        cv_file.name = unique_filename

        data = {
            'email': 'upload_fail@example.com',
            'phone': '1234567890',
            'distinction_name': 'test-link-developer',
            'cv': cv_file,
        }

        response = self.client.post(self.list_url, data, format='multipart')
        
        # Should still succeed since CV upload is non-critical
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("Application submitted with CV upload warning", response.data['detail'])
        self.assertTrue(response.data['llm_success'])

    def test_supabase_duplicate_upload(self, mock_create_user, mock_create_employee, mock_upload_to_supabase):
        """Test application when Supabase detects duplicate file"""
        # Configure duplicate upload error
        unique_filename = self.generate_unique_filename()
        mock_upload_to_supabase.side_effect = ClientException(
            message="Duplicate file",
            code=409,
            response=MagicMock(status_code=409))
        
        mock_user = MagicMock()
        mock_user.username = 'duplicate@example.com'
        mock_create_user.return_value = mock_user
        
        mock_employee = MagicMock()
        mock_employee.user = mock_user
        mock_create_employee.return_value = mock_employee

        # Test data
        cv_content = b"This is a mock CV content."
        cv_file = io.BytesIO(cv_content)
        cv_file.name = unique_filename

        data = {
            'email': 'duplicate@example.com',
            'phone': '1234567890',
            'distinction_name': 'test-link-developer',
            'cv': cv_file,
        }

        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("Application submitted with CV upload warning", response.data['detail'])
        self.assertTrue(response.data['llm_success'])

    def test_existing_user_application(self, mock_create_user, mock_create_employee, mock_upload_to_supabase):
        """Test application with existing user"""
        # Create real existing user
        User.objects.create_user(username='existing@example.com', password='password123')
        
        # Test data
        unique_filename = self.generate_unique_filename()
        cv_content = b"This is a mock CV content."
        cv_file = io.BytesIO(cv_content)
        cv_file.name = unique_filename

        data = {
            'email': 'existing@example.com',
            'phone': '1234567890',
            'distinction_name': 'test-link-developer',
            'cv': cv_file,
        }

        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("User already exists", response.data['detail'])
        
        # Verify no upload or creation happened
        mock_upload_to_supabase.assert_not_called()
        mock_create_user.assert_not_called()
        mock_create_employee.assert_not_called()

    def test_missing_fields(self, mock_create_user, mock_create_employee, mock_upload_to_supabase):
        """Test application with missing required fields"""
        # Test data with missing required fields
        unique_filename = self.generate_unique_filename()
        cv_content = b"This is a mock CV content."
        cv_file = io.BytesIO(cv_content)
        cv_file.name = unique_filename

        data = {
            'email': 'incomplete@example.com',
            # Missing phone and distinction_name
            'cv': cv_file,
        }

        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Missing required fields", response.data['detail'])
        
        # Verify no upload or creation happened
        mock_upload_to_supabase.assert_not_called()
        mock_create_user.assert_not_called()
        mock_create_employee.assert_not_called()

    def test_invalid_distinction_name(self, mock_create_user, mock_create_employee, mock_upload_to_supabase):
        """Test application with invalid distinction name"""
        # Test data with invalid distinction name
        unique_filename = self.generate_unique_filename()
        cv_content = b"This is a mock CV content."
        cv_file = io.BytesIO(cv_content)
        cv_file.name = unique_filename

        data = {
            'email': 'invalidlink@example.com',
            'phone': '1234567890',
            'distinction_name': 'non-existent-link',
            'cv': cv_file,
        }

        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid distinction name", response.data['detail'])
        
        # Verify no upload or creation happened
        mock_upload_to_supabase.assert_not_called()
        mock_create_user.assert_not_called()
        mock_create_employee.assert_not_called()

    def test_applicants_limit_exceeded(self, mock_create_user, mock_create_employee, mock_upload_to_supabase):
        """Test application when applicants limit is exceeded"""
        # Create limited application link
        limited_link = ApplicationLink.objects.create(
            distinction_name="limited-link",
            position=self.position,
            is_coordinator=False,
            number_remaining_applicants_to_limit=0  # No more applicants allowed
        )
        limited_link.skills.add(self.skill1)

        # Test data
        unique_filename = self.generate_unique_filename()
        cv_content = b"This is a mock CV content."
        cv_file = io.BytesIO(cv_content)
        cv_file.name = unique_filename

        data = {
            'email': 'limit@example.com',
            'phone': '1234567890',
            'distinction_name': 'limited-link',
            'cv': cv_file,
        }

        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Limit of applicants exceeded", response.data['detail'])
        
        # Verify no upload or creation happened
        mock_upload_to_supabase.assert_not_called()
        mock_create_user.assert_not_called()
        mock_create_employee.assert_not_called()