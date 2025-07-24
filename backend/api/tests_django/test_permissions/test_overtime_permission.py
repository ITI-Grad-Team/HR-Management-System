# tests_django/test_permissions/test_overtime_permission.py
import pytest
from api.permissions import OvertimeRequestPermission

@pytest.mark.django_db
class TestOvertimeRequestPermission:
    def test_create_employee_allowed(self, employee_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = employee_user
        view = view_with_action('create')
        assert permission.has_permission(request, view) is True

    def test_create_coordinator_allowed(self, coordinator_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = coordinator_user
        view = view_with_action('create')
        assert permission.has_permission(request, view) is True

    def test_create_hr_denied(self, hr_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = hr_user
        view = view_with_action('create')
        assert permission.has_permission(request, view) is False

    def test_approve_hr_allowed(self, hr_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = hr_user
        view = view_with_action('approve')
        assert permission.has_permission(request, view) is True

    def test_approve_admin_allowed(self, admin_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = admin_user
        view = view_with_action('approve')
        assert permission.has_permission(request, view) is True

    def test_approve_employee_denied(self, employee_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = employee_user
        view = view_with_action('approve')
        assert permission.has_permission(request, view) is False

    def test_update_hr_allowed(self, hr_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = hr_user
        view = view_with_action('update')
        assert permission.has_permission(request, view) is True

    def test_update_admin_allowed(self, admin_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = admin_user
        view = view_with_action('update')
        assert permission.has_permission(request, view) is True

    def test_update_employee_denied(self, employee_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = employee_user
        view = view_with_action('update')
        assert permission.has_permission(request, view) is False

    def test_list_all_authenticated_users(self, employee_user, hr_user, admin_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        view = view_with_action('list')
        for user in [employee_user, hr_user, admin_user]:
            request = factory.get('/')
            request.user = user
            assert permission.has_permission(request, view) is True

    def test_list_anonymous_denied(self, anonymous_user, factory, view_with_action):
        permission = OvertimeRequestPermission()
        request = factory.get('/')
        request.user = anonymous_user
        view = view_with_action('list')
        assert permission.has_permission(request, view) is False