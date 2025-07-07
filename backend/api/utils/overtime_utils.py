# utils/overtime_utils.py
from datetime import datetime, time
from django.utils import timezone


def can_request_overtime(user, attendance_record):
    """
    Check if user can request overtime for given attendance record
    Returns: (can_request: bool, reason: str)
    """

    # Check if it's the same day
    today = timezone.localtime().date()
    if attendance_record.date != today:
        return False, "Can only request overtime on the same day"

    # Check if overtime request already exists
    if hasattr(attendance_record, "overtime_request"):
        return False, "Overtime request already exists"

    # Get expected leave time
    expected_leave_time = time(17, 0)  # Default 5:00 PM
    if (
        hasattr(attendance_record.user, "employee")
        and attendance_record.user.employee.expected_leave_time
    ):
        expected_leave_time = attendance_record.user.employee.expected_leave_time

    # Check if 30 minutes have passed since expected leave time
    current_time = timezone.localtime().time()
    leave_plus_30min = datetime.combine(today, expected_leave_time)
    leave_plus_30min = leave_plus_30min.replace(minute=leave_plus_30min.minute + 30)
    if leave_plus_30min.minute >= 60:
        leave_plus_30min = leave_plus_30min.replace(
            hour=leave_plus_30min.hour + 1, minute=leave_plus_30min.minute - 60
        )

    if current_time < leave_plus_30min.time():
        return (
            False,
            f"Can request overtime after {leave_plus_30min.time().strftime('%H:%M')}",
        )

    return True, "Can request overtime"
