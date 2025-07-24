# tests_django/test_permissions/test_is_coordinator.py
import pytest
from api.permissions import IsCoordinator

@pytest.mark.django_db
class TestIsCoordinator:
    def test_coordinator_user_has_permission(self, coordinator_user, factory):
        # Verify the user is properly set up as coordinator
        assert hasattr(coordinator_user, 'employee')
        assert coordinator_user.employee.is_coordinator is True
        
        permission = IsCoordinator()
        request = factory.get('/')
        request.user = coordinator_user
        assert permission.has_permission(request, None) is True

    def test_regular_employee_no_permission(self, employee_user, factory):
        # Verify regular employee is not coordinator
        assert hasattr(employee_user, 'employee')
        assert employee_user.employee.is_coordinator is False
        
        permission = IsCoordinator()
        request = factory.get('/')
        request.user = employee_user
        assert permission.has_permission(request, None) is False

    def test_hr_user_no_permission(self, hr_user, factory):
        permission = IsCoordinator()
        request = factory.get('/')
        request.user = hr_user
        assert permission.has_permission(request, None) is False

    def test_admin_user_no_permission(self, admin_user, factory):
        permission = IsCoordinator()
        request = factory.get('/')
        request.user = admin_user
        assert permission.has_permission(request, None) is False

    def test_no_role_user_no_permission(self, no_role_user, factory):
        permission = IsCoordinator()
        request = factory.get('/')
        request.user = no_role_user
        assert permission.has_permission(request, None) is False

    def test_anonymous_user_no_permission(self, anonymous_user, factory):
        permission = IsCoordinator()
        request = factory.get('/')
        request.user = anonymous_user
        assert permission.has_permission(request, None) is False