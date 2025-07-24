# tests_django/test_permissions/test_attendance_permission.py
import pytest
from api.permissions import AttendancePermission

@pytest.mark.django_db
class TestAttendancePermission:
    def test_check_in_employee_allowed(self, employee_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = employee_user
        view = view_with_action('check_in')
        assert permission.has_permission(request, view) is True

    def test_check_in_hr_denied(self, hr_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = hr_user
        view = view_with_action('check_in')
        assert permission.has_permission(request, view) is False

    def test_can_request_overtime_employee(self, employee_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = employee_user
        view = view_with_action('can_request_overtime')
        assert permission.has_permission(request, view) is True

    def test_can_request_overtime_coordinator(self, coordinator_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = coordinator_user
        view = view_with_action('can_request_overtime')
        assert permission.has_permission(request, view) is True

    def test_create_admin_allowed(self, admin_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = admin_user
        view = view_with_action('create')
        assert permission.has_permission(request, view) is True

    def test_create_hr_allowed(self, hr_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = hr_user
        view = view_with_action('create')
        assert permission.has_permission(request, view) is True

    def test_create_employee_denied(self, employee_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = employee_user
        view = view_with_action('create')
        assert permission.has_permission(request, view) is False

    def test_destroy_admin_allowed(self, admin_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = admin_user
        view = view_with_action('destroy')
        assert permission.has_permission(request, view) is True

    def test_destroy_hr_denied(self, hr_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = hr_user
        view = view_with_action('destroy')
        assert permission.has_permission(request, view) is False

    def test_list_all_authenticated_users(self, employee_user, hr_user, admin_user, factory, view_with_action):
        permission = AttendancePermission()
        view = view_with_action('list')
        for user in [employee_user, hr_user, admin_user]:
            request = factory.get('/')
            request.user = user
            assert permission.has_permission(request, view) is True

    def test_list_anonymous_denied(self, anonymous_user, factory, view_with_action):
        permission = AttendancePermission()
        request = factory.get('/')
        request.user = anonymous_user
        view = view_with_action('list')
        assert permission.has_permission(request, view) is False