from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from datetime import time
from .models import AttendanceRecord, WorkDayConfig, PublicHoliday
from .serializers import AttendanceRecordSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    # Attendance timing constants
    WORK_START = time(9, 0)
    GRACE_END = time(9, 15)
    WORK_END = time(17, 0)

    def create(self, request, *args, **kwargs):
        user = request.user
        check_in_datetime_str = request.data.get("check_in_datetime")
        now_dt = None
        if check_in_datetime_str:
            from django.utils.dateparse import parse_datetime

            parsed_dt = parse_datetime(check_in_datetime_str)
            if not parsed_dt:
                return Response(
                    {
                        "detail": "Invalid check_in_datetime format. Use ISO 8601 format."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if timezone.is_naive(parsed_dt):
                # Assume local timezone if naive
                parsed_dt = timezone.make_aware(
                    parsed_dt, timezone.get_current_timezone()
                )
            now_dt = timezone.localtime(parsed_dt)
        else:
            now_dt = timezone.localtime()

        today = now_dt.date()
        now = now_dt.time()

        # Check for public holiday
        if PublicHoliday.objects.filter(date=today).exists():
            return Response(
                {"detail": "Today is a public holiday."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for workday config
        weekday = today.weekday()  # Monday=0
        try:
            workday_cfg = WorkDayConfig.objects.get(weekday=weekday)
        except WorkDayConfig.DoesNotExist:
            return Response(
                {"detail": "Workday configuration not found for today."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not workday_cfg.is_workday:
            return Response(
                {"detail": "Today is not a working day."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent duplicate check-in
        if AttendanceRecord.objects.filter(user=user, date=today).exists():
            return Response(
                {"detail": "Attendance already submitted for today."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # MAC address validation for physical days
        attendance_type = "online" if workday_cfg.is_online else "physical"
        mac_address_used = request.data.get("mac_address")
        if attendance_type == "physical":
            # user_mac = getattr(user, "mac_address", None)
            # if not user_mac or mac_address_used != user_mac:
            #     return Response(
            #         {"detail": "Invalid MAC address for physical attendance."},
            #         status=status.HTTP_400_BAD_REQUEST,
            #     )
            pass
        else:
            mac_address_used = None

        # Timing logic
        if now <= self.GRACE_END:
            status_val = "present"
        elif now > self.GRACE_END and now < self.WORK_END:
            status_val = "late"
        else:
            return Response(
                {"detail": "Check-in is not allowed after end of workday."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        check_out_time = request.data.get("check_out_time")
        overtime_approved = request.data.get("overtime_approved", False)
        overtime_hours = 0.0

        if check_out_time:
            from datetime import datetime
            from django.utils.dateparse import parse_time

            parsed_check_out = (
                parse_time(check_out_time)
                if isinstance(check_out_time, str)
                else check_out_time
            )
            if parsed_check_out:
                # Only calculate overtime if check_out_time is after WORK_END
                if parsed_check_out > self.WORK_END:
                    # Use today's date for both times to get timedelta
                    dt_work_end = datetime.combine(
                        today, self.WORK_END, tzinfo=now_dt.tzinfo
                    )
                    dt_check_out = datetime.combine(
                        today, parsed_check_out, tzinfo=now_dt.tzinfo
                    )
                    overtime_delta = dt_check_out - dt_work_end
                    overtime_hours_val = overtime_delta.total_seconds() / 3600.0
                    if overtime_approved and overtime_hours_val > 0:
                        overtime_hours = round(overtime_hours_val, 2)
            else:
                return Response(
                    {"detail": "Invalid check_out_time format. Use HH:MM[:ss] format."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        record = AttendanceRecord.objects.create(
            user=user,
            date=today,
            check_in_time=now,
            check_in_datetime=now_dt,
            attendance_type=attendance_type,
            status=status_val,
            mac_address=mac_address_used,
            check_out_time=check_out_time,
            overtime_approved=overtime_approved,
            overtime_hours=overtime_hours,
        )
        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
