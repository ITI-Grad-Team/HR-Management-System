# tests_django/test_permissions/test_is_admin.py
import pytest
from api.permissions import IsAdmin

@pytest.mark.django_db
class TestIsAdmin:
    def test_admin_user_has_permission(self, admin_user, factory):
        permission = IsAdmin()
        request = factory.get('/')
        request.user = admin_user
        assert permission.has_permission(request, None) is True

    def test_hr_user_no_permission(self, hr_user, factory):
        permission = IsAdmin()
        request = factory.get('/')
        request.user = hr_user
        assert permission.has_permission(request, None) is False

    def test_employee_user_no_permission(self, employee_user, factory):
        permission = IsAdmin()
        request = factory.get('/')
        request.user = employee_user
        assert permission.has_permission(request, None) is False

    def test_no_role_user_no_permission(self, no_role_user, factory):
        permission = IsAdmin()
        request = factory.get('/')
        request.user = no_role_user
        assert permission.has_permission(request, None) is False

    def test_anonymous_user_no_permission(self, anonymous_user, factory):
        permission = IsAdmin()
        request = factory.get('/')
        request.user = anonymous_user
        assert permission.has_permission(request, None) is False