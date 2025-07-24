# tests_django/test_permissions/test_is_hr_or_employee.py
import pytest
from api.permissions import IsHROrEmployee

@pytest.mark.django_db
class TestIsHROrEmployee:
    def test_hr_user_has_permission(self, hr_user, factory):
        permission = IsHROrEmployee()
        request = factory.get('/')
        request.user = hr_user
        assert permission.has_permission(request, None) is True

    def test_employee_user_has_permission(self, employee_user, factory):
        permission = IsHROrEmployee()
        request = factory.get('/')
        request.user = employee_user
        assert permission.has_permission(request, None) is True

    def test_coordinator_user_has_permission(self, coordinator_user, factory):
        permission = IsHROrEmployee()
        request = factory.get('/')
        request.user = coordinator_user
        assert permission.has_permission(request, None) is True

    def test_admin_user_no_permission(self, admin_user, factory):
        permission = IsHROrEmployee()
        request = factory.get('/')
        request.user = admin_user
        assert permission.has_permission(request, None) is False

    def test_no_role_user_no_permission(self, no_role_user, factory):
        permission = IsHROrEmployee()
        request = factory.get('/')
        request.user = no_role_user
        assert permission.has_permission(request, None) is False

    def test_anonymous_user_no_permission(self, anonymous_user, factory):
        permission = IsHROrEmployee()
        request = factory.get('/')
        request.user = anonymous_user
        assert permission.has_permission(request, None) is False