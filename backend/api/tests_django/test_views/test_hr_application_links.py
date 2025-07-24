# tests/test_hr_application_links.py
import pytest
from rest_framework import status
from django.urls import reverse
from api.models import ApplicationLink, Position, Skill

@pytest.mark.django_db
class TestHRManageApplicationLinksViewSet:
    def test_create_application_link(self, api_client, hr_user, position, skill):
        api_client.force_authenticate(user=hr_user)
        url = reverse('applicationlink-list')
        data = {
            'distinction_name': 'frontend-2024',
            'position': position.id,
            'is_coordinator': False,
            'skills': [skill.id]
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert ApplicationLink.objects.count() == 1

    def test_list_application_links(self, api_client, hr_user, application_link):
        api_client.force_authenticate(user=hr_user)
        url = reverse('applicationlink-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['distinction_name'] == 'dev-2024'

    def test_filter_links_by_position(self, api_client, hr_user, application_link, position):
        api_client.force_authenticate(user=hr_user)
        url = reverse('applicationlink-list') + f'?position={position.id}'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_permission_denied_for_non_hr(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        url = reverse('applicationlink-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN