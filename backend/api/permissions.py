from rest_framework.permissions import BasePermission

class IsHR(BasePermission):
    """
    Allows access only to users with role='hr' in BasicInfo.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated and
            hasattr(user, 'basicinfo') and
            user.basicinfo.role == 'hr'
        )


class IsEmployee(BasePermission):
    """
    Allows access only to users with role='employee' in BasicInfo.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated and
            hasattr(user, 'basicinfo') and
            user.basicinfo.role == 'employee'
        )


class IsAdmin(BasePermission):
    """
    Allows access only to users with role='admin' in BasicInfo.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated and
            hasattr(user, 'basicinfo') and
            user.basicinfo.role == 'admin'
        )

from rest_framework.permissions import BasePermission

class IsHRorAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'basicinfo') and
            request.user.basicinfo.role in ['hr', 'admin']
        )
