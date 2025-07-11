from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from datetime import time
from .models import AttendanceRecord, WorkDayConfig, PublicHoliday
from .utils.queryset_utils import get_role_based_queryset
from .serializers import AttendanceRecordSerializer
from .utils.overtime_utils import can_request_overtime
from .permissions import AttendancePermission


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, AttendancePermission]

    # Attendance timing constants
    WORK_START = time(9, 0)
    GRACE_END = time(9, 15)
    WORK_END = time(17, 0)

    def get_queryset(self):
        return get_role_based_queryset(self.request.user, AttendanceRecord)

    def create(self, request, *args, **kwargs):
        """HR/Admin only: Create a manual attendance record."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def check_in(self, request):
        """Employee only: Record check-in for today."""
        user = request.user
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
        weekday = today.weekday()
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
            # Placeholder for MAC validation (commented out as in original)
            pass
        else:
            mac_address_used = None

        # Determine status
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
            check_in_datetime=now_dt,
            attendance_type=attendance_type,
            status=status_val,
            mac_address=mac_address_used,
        )
        serializer = self.get_serializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"])
    def check_out(self, request, pk=None):
        """Employee only: Record check-out for an attendance record."""
        record = self.get_object()
        if record.user != request.user:
            return Response(
                {"detail": "You can only check out your own attendance."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if record.check_out_time:
            return Response(
                {"detail": "Check-out already recorded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now_dt = timezone.localtime()
        record.check_out_time = now_dt.time()
        record.save()

        serializer = self.get_serializer(record)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def can_request_overtime(self, request, pk=None):
        """Check if user can request overtime for this attendance record."""
        attendance_record = self.get_object()
        can_request, reason = can_request_overtime(request.user, attendance_record)
        return Response(
            {
                "can_request": can_request,
                "reason": reason,
                "has_existing_request": hasattr(attendance_record, "overtime_request"),
            }
        )
