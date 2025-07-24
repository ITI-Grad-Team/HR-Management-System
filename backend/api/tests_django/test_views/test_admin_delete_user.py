# test_admin_delete_user.py
import pytest
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from api.models import HR, Employee

User = get_user_model()

@pytest.mark.django_db
class TestAdminUserDeletion:
    def test_admin_can_disable_hr(self, api_client, admin_user, hr_user):
        """
        Test that admin can disable an HR user through existing endpoints
        """
        api_client.force_authenticate(user=admin_user)
        
        # Step 1: Get HR user details through existing endpoint
        hr_detail_url = reverse('admin-hrs-detail', kwargs={'pk': hr_user.hr.id})
        response = api_client.get(hr_detail_url)
        assert response.status_code == status.HTTP_200_OK
        
        # Step 2: Disable the user by making them inactive
        user_update_url = reverse('admin-hrs-detail', kwargs={'pk': hr_user.hr.id})
        response = api_client.patch(user_update_url, {
            'user': {
                'is_active': False
            }
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        hr_user.refresh_from_db()
        assert hr_user.is_active is False

    def test_admin_can_disable_employee(self, api_client, admin_user, employee_user):
        """
        Test that admin can disable an employee through existing endpoints
        """
        api_client.force_authenticate(user=admin_user)
        
        # Step 1: Get employee details through existing endpoint
        emp_detail_url = reverse('admin-employees-detail', kwargs={'pk': employee_user.employee.id})
        response = api_client.get(emp_detail_url)
        assert response.status_code == status.HTTP_200_OK
        
        # Step 2: Disable the user by making them inactive
        user_update_url = reverse('admin-employees-detail', kwargs={'pk': employee_user.employee.id})
        response = api_client.patch(user_update_url, {
            'user': {
                'is_active': False
            }
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        employee_user.refresh_from_db()
        assert employee_user.is_active is False

    def test_hr_cannot_disable_users(self, api_client, hr_user, employee_user):
        """
        Test that HR cannot disable users through admin endpoints
        """
        api_client.force_authenticate(user=hr_user)
        
        # Try to disable an employee
        emp_detail_url = reverse('admin-employees-detail', kwargs={'pk': employee_user.employee.id})
        response = api_client.patch(emp_detail_url, {
            'user': {
                'is_active': False
            }
        }, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        employee_user.refresh_from_db()
        assert employee_user.is_active is True  # Should remain unchanged