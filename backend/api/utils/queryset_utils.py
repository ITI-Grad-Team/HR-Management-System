from django.db.models import Q


def get_role_based_queryset(user, model):
    """
    Returns a queryset for the given model filtered by the user's role.
    Supports AttendanceRecord and OvertimeRequest models.
    """
    role = user.basicinfo.role.lower()

    if model.__name__ == "AttendanceRecord":
        if role in ["admin", "hr"]:
            return model.objects.all()
        # For any employee, including coordinators, only their own records should be shown
        # on a "my attendance" style page. A separate view should handle team views.
        # elif hasattr(user, "employee") and user.employee.is_coordinator:
        #     return model.objects.filter(user__employee__position=user.employee.position)

        elif role == "employee":
            return model.objects.filter(user=user)
        else:
            return model.objects.none()

    elif model.__name__ == "OvertimeRequest":
        if role in ["admin", "hr"]:
            return model.objects.all()
        elif hasattr(user, "employee") and user.employee.is_coordinator:
            return model.objects.filter(
                Q(attendance_record__user=user)
                | Q(attendance_record__user__employee__position=user.employee.position)
            )
        else:
            return model.objects.filter(attendance_record__user=user)

    else:
        # Default: return all (should be extended for other models)
        return model.objects.all()
