# tests/test_view_self.py
import pytest
from rest_framework import status
from django.urls import reverse

@pytest.mark.django_db
class TestViewSelfViewSet:
    def test_view_self_as_employee(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        url = reverse('viewself-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['role'] == 'employee'
        assert response.data['user']['username'] == 'employee@example.com'

    def test_view_self_as_hr(self, api_client, hr_user):
        api_client.force_authenticate(user=hr_user)
        url = reverse('viewself-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['role'] == 'hr'
        assert response.data['user']['username'] == 'hr@example.com'

    def test_view_self_as_admin(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('viewself-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['role'] == 'admin'
        assert response.data['user']['username'] == 'admin@example.com'