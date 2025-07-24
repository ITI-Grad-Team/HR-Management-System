from rest_framework.permissions import BasePermission


class IsHR(BasePermission):
    """
    Allows access only to users with role='hr' in BasicInfo.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated
            and hasattr(user, "basicinfo")
            and user.basicinfo.role == "hr"
        )


class IsEmployee(BasePermission):
    """
    Allows access only to users with role='employee' in BasicInfo.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated
            and hasattr(user, "basicinfo")
            and user.basicinfo.role == "employee"
        )


class IsAdmin(BasePermission):
    """
    Allows access only to users with role='admin' in BasicInfo.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated
            and hasattr(user, "basicinfo")
            and user.basicinfo.role == "admin"
        )


class IsHRorAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "basicinfo")
            and request.user.basicinfo.role in ["hr", "admin"]
        )


class IsCoordinator(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "employee")
            and request.user.employee.is_coordinator
        )


class AttendancePermission(BasePermission):
    """
    Custom permission for AttendanceViewSet.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated or not hasattr(user, "basicinfo"):
            return False
        role = user.basicinfo.role.lower()
        # Allow check-in/check-out for employees only on themselves
        if view.action in ["check_in", "check_out", "check_in_status"]:
            return role == "employee"
        # Allow can_request_overtime and get_join_date for employees and coordinators
        if view.action in ["can_request_overtime", "get_join_date"]:
            return role == "employee" or (
                hasattr(user, "employee") and user.employee.is_coordinator
            )
        # Only admin/hr can create/update
        if view.action in ["create", "update", "partial_update"]:
            return role in ["admin", "hr"]
        # Only admin can delete
        if view.action == "destroy":
            return role == "admin"
        # List/retrieve: all roles can view, but queryset will be filtered
        if view.action in ["list", "retrieve"]:
            return True
        return False


class OvertimeRequestPermission(BasePermission):
    """
    Custom permission for OvertimeRequestViewSet.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated or not hasattr(user, "basicinfo"):
            return False

        role = user.basicinfo.role.lower()

        # Submit requests: Employee or Coordinator only
        if view.action == "create":
            return role in ["employee"] or (
                hasattr(user, "employee") and user.employee.is_coordinator
            )

        # Approve/Reject/Pending: HR or Admin only
        if view.action in [
            "approve",
            "reject",
            "pending",
            "recent",
            "revert_to_pending",
        ]:
            return role in ["hr", "admin"]

        # List/Retrieve: All authenticated users (filtered by queryset)
        if view.action in ["list", "retrieve"]:
            return True

        # Update/Delete: HR or Admin only
        if view.action in ["update", "partial_update", "destroy"]:
            return role in ["hr", "admin"]

        return False


class IsHROrEmployee(BasePermission):
    """
    Allows access only to users with role='hr' or 'employee' in BasicInfo.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated
            and hasattr(user, "basicinfo")
            and user.basicinfo.role in ["hr", "employee"]
        )
