import pytest
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestHRManageApplicationLinksViewSet:
    def test_create_application_link(self, api_client, hr_user, position, skill):
        api_client.force_authenticate(user=hr_user)
        url = '/api/hr/application-links/'  # Updated to match actual URL name
        data = {
            'distinction_name': 'dev-2024',
            'position': position.id,
            'skills': [skill.id],
            'is_coordinator': False,
            'number_remaining_applicants_to_limit': 10,
            'url': 'https://example.com/apply'
        }
        response = api_client.post(url, data)
        print("Response data:", response.data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'distinction_name' in response.data
        assert response.data['position'] == position.id

    def test_list_application_links(self, api_client, hr_user, application_link):
        api_client.force_authenticate(user=hr_user)
        url = '/api/hr/application-links/'  # Updated to match actual URL name
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_filter_links_by_position(self, api_client, hr_user, application_link, position):
        api_client.force_authenticate(user=hr_user)
        url = '/api/hr/application-links/' + f'?position={position.id}'  # Updated URL name
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['position'] == position.id

    def test_permission_denied_for_non_hr(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        url = '/api/hr/application-links/'  # Updated to match actual URL name
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN