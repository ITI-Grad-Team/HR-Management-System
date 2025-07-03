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
        today = timezone.localdate()
        now = timezone.localtime().time()

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
            user_mac = getattr(user, "mac_address", None)
            if not user_mac or mac_address_used != user_mac:
                return Response(
                    {"detail": "Invalid MAC address for physical attendance."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
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

        record = AttendanceRecord.objects.create(
            user=user,
            date=today,
            check_in_time=now,
            attendance_type=attendance_type,
            status=status_val,
            mac_address=mac_address_used,
        )
        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # Note: For now, check_in_datetime is not stored; only check_in_time and date are saved.
