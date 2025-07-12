from django.utils import timezone
from datetime import datetime, timedelta

def can_request_overtime(user, attendance_record):
    """
    Timezone-aware overtime eligibility checker
    Returns: (can_request: bool, reason: str)
    """
    # 1. Basic validations
    if attendance_record.user != user:
        return False, "Cannot check other employees' records"
    
    if not hasattr(user, 'employee'):
        return False, "Employee profile not found"
    
    employee = user.employee
    now = timezone.localtime()  # Timezone-aware current time
    today = now.date()

    # 2. Record validations
    if attendance_record.date != today:
        return False, "Can only request overtime on the same day"
    
    if not attendance_record.check_out_time:
        return False, "Must check out before requesting overtime"

    # 3. Time calculations (all timezone-aware)
    actual_leave_time = datetime.combine(today, attendance_record.check_out_time)
    actual_leave_time = timezone.make_aware(actual_leave_time)  # Convert to aware datetime
    
    overtime_threshold = timedelta(minutes=getattr(employee, 'overtime_threshold_minutes', 30))
    eligibility_time = actual_leave_time + overtime_threshold

    # 4. Time comparisons
    if now < eligibility_time:
        return False, (
            f"Can request overtime after {eligibility_time.strftime('%H:%M')} "
            f"({overtime_threshold.total_seconds()/60} minutes after your actual leave time)"
        )

    return True, "Eligible for overtime request"