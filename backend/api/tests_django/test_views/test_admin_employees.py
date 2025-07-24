# test_admin_employees.py
import pytest
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestAdminViewEmployeesViewSet:
    def test_list_employees_as_admin(self, api_client, admin_user, employee_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-employees-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1

    def test_retrieve_employee_as_admin(self, api_client, admin_user, employee_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-employees-detail', kwargs={'pk': employee_user.employee.id})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['username'] == 'employee@example.com'

    def test_update_cv_data(self, api_client, admin_user, employee_user, skill):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-employees-detail', kwargs={'pk': employee_user.employee.id}) + 'update-cv-data/'
        data = {
            'years_of_experience': 5,
            'had_leadership_role': True,
            'skills': [skill.id]
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        employee_user.employee.refresh_from_db()
        assert employee_user.employee.years_of_experience == 5
        assert employee_user.employee.skills.count() == 1

    def test_update_compensation(self, api_client, admin_user, employee_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-employees-detail', kwargs={'pk': employee_user.employee.id}) + 'update-compensation/'
        data = {
            'basic_salary': 5000,
            'holiday_weekdays': [1],  # Monday
            'online_weekdays': [5]     # Friday
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        employee_user.employee.refresh_from_db()
        assert employee_user.employee.basic_salary == 5000
        assert employee_user.employee.holidayweekday_set.count() == 1
        assert employee_user.employee.onlinedayweekday_set.count() == 1

    def test_permission_denied_for_non_admin(self, api_client, hr_user):
        api_client.force_authenticate(user=hr_user)
        url = reverse('admin-employees-list')  # Test admin-specific endpoint
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN