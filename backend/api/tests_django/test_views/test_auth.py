# tests/test_auth.py
import pytest
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestAuthViews:
    def test_forgot_password(self, api_client, employee_user):
        url = reverse('forgotpassword')
        data = {'email': 'employee@example.com'}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data

    def test_forgot_password_invalid_email(self, api_client):
        url = reverse('forgotpassword')
        data = {'email': 'nonexistent@example.com'}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_change_password(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        url = reverse('changepassword')
        data = {
            'old_password': 'emppass',
            'new_password': 'newpassword123'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        employee_user.refresh_from_db()
        assert employee_user.check_password('newpassword123')