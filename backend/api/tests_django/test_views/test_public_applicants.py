# tests/test_public_applicants.py
import pytest
from rest_framework import status
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import Employee, ApplicationLink

@pytest.mark.django_db
class TestPublicApplicantsViewSet:
    def test_create_application(self, api_client, application_link):
        url = reverse('publicapplicants-list')
        cv_file = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        data = {
            'email': 'new@example.com',
            'phone': '1234567890',
            'distinction_name': 'dev-2024',
            'cv': cv_file
        }
        response = api_client.post(url, data, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED
        assert Employee.objects.count() == 1
        assert response.data['llm_success'] in [True, False]  # LLM may or may not succeed

    def test_missing_fields(self, api_client, application_link):
        url = reverse('publicapplicants-list')
        data = {
            'email': 'new@example.com',
            # Missing phone, distinction_name, cv
        }
        response = api_client.post(url, data, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_distinction_name(self, api_client):
        url = reverse('publicapplicants-list')
        cv_file = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        data = {
            'email': 'new@example.com',
            'phone': '1234567890',
            'distinction_name': 'invalid-link',
            'cv': cv_file
        }
        response = api_client.post(url, data, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST