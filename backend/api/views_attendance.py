from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from datetime import time, datetime, timedelta
from .models import (
    AttendanceRecord,
    OnlineDayYearday,
    HolidayYearday,
    HolidayWeekday,
    OnlineDayWeekday,
    OvertimeRequest,
)
from .utils.queryset_utils import get_role_based_queryset
from .utils.geolocation_utils import validate_attendance_location
from .serializers import AttendanceRecordSerializer
from .utils.overtime_utils import can_request_overtime
from .permissions import AttendancePermission
from .views import EightPerPagePagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.contrib.auth import get_user_model

User = get_user_model()


class AttendanceRecordFilter(DjangoFilterBackend):
    def filter_queryset(self, request, queryset, view):
        user_query = request.query_params.get("user", None)
        date_query = request.query_params.get("date", None)
        month_query = request.query_params.get("month", None)
        year_query = request.query_params.get("year", None)
        date_from = request.query_params.get("date_from", None)
        date_to = request.query_params.get("date_to", None)

        if user_query:
            if user_query.isdigit():
                queryset = queryset.filter(user__id=user_query)
            else:
                queryset = queryset.filter(
                    Q(user__username__icontains=user_query)
                    | Q(user__email__icontains=user_query)
                )

        if date_query:
            queryset = queryset.filter(date=date_query)

        # Month and Year filtering
        if month_query and month_query.isdigit():
            queryset = queryset.filter(date__month=int(month_query))

        if year_query and year_query.isdigit():
            queryset = queryset.filter(date__year=int(year_query))

        # Date range filtering
        if date_from:
            try:
                from_date = timezone.datetime.strptime(date_from, "%Y-%m-%d").date()
                queryset = queryset.filter(date__gte=from_date)
            except ValueError:
                pass

        if date_to:
            try:
                to_date = timezone.datetime.strptime(date_to, "%Y-%m-%d").date()
                queryset = queryset.filter(date__lte=to_date)
            except ValueError:
                pass

        return queryset


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all().order_by("-date")
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, AttendancePermission]
    pagination_class = EightPerPagePagination
    filter_backends = [AttendanceRecordFilter]

    # Attendance timing constants
    WORK_START = time(9, 0)
    GRACE_END = time(9, 15)
    WORK_END = time(17, 0)

    def get_queryset(self):
        """Special handling for can_request_overtime and get_join_date to bypass role filters"""
        if self.action in ["can_request_overtime", "get_join_date"]:
            # Bypass role filtering for these actions
            return AttendanceRecord.objects.all().order_by("-date")
        # Normal role-based filtering for all other actions with proper ordering
        return get_role_based_queryset(self.request.user, AttendanceRecord).order_by(
            "-date"
        )

    @action(detail=False, methods=["get"])
    def check_in_status(self, request):
        """Employee only: Get status for today's check-in."""
        user = request.user
        now_dt = timezone.localtime()
        today = now_dt.date()
        now_time = now_dt.time()
        weekday_name = today.strftime("%A")

        employee = user.employee

        # 1. Check if already checked in
        if AttendanceRecord.objects.filter(user=user, date=today).exists():
            return Response(
                {"can_check_in": False, "reason": "You have already checked in today."}
            )

        # 2. Check for holidays
        if (
            HolidayYearday.objects.filter(
                month=today.month, day=today.day, employees=employee
            ).exists()
            or HolidayWeekday.objects.filter(
                weekday=weekday_name, employees=employee
            ).exists()
        ):
            return Response(
                {"can_check_in": False, "reason": "Check-in is disabled on a holiday."}
            )

        # 3. Check if today is an online day
        is_online_day = (
            OnlineDayYearday.objects.filter(
                month=today.month, day=today.day, employees=employee
            ).exists()
            or OnlineDayWeekday.objects.filter(
                weekday=weekday_name, employees=employee
            ).exists()
        )
        if is_online_day:
            return Response(
                {
                    "can_check_in": True,
                    "reason": "Today is an online work day. You can check in.",
                }
            )

        # 4. Check for work schedule
        if not employee.expected_attend_time:
            return Response(
                {
                    "can_check_in": False,
                    "reason": "Your work schedule is not configured.",
                }
            )

        # 5. Check if it's too early
        if now_time < employee.expected_attend_time:
            return Response(
                {
                    "can_check_in": False,
                    "reason": f"You can check in after {employee.expected_attend_time.strftime('%I:%M %p')}.",
                }
            )

        # 6. Check if it's too late (after work day ends)
        if employee.expected_leave_time and now_time > employee.expected_leave_time:
            return Response(
                {
                    "can_check_in": False,
                    "reason": "Check-in is not allowed after your workday has ended.",
                }
            )

        return Response({"can_check_in": True, "reason": "You can check in now."})

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
        weekday_name = today.strftime("%A")  # Get weekday name for HolidayWeekday check

        # Get employee record (added this since we need employee-specific data)
        employee = user.employee

        # Changed: Check for holidays using new Holiday models instead of PublicHoliday
        if (
            HolidayYearday.objects.filter(
                month=today.month, day=today.day, employees=employee
            ).exists()
            or HolidayWeekday.objects.filter(
                weekday=weekday_name, employees=employee
            ).exists()
        ):
            return Response(
                {"detail": "Today is your holiday."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Changed: Check if today is an online day using new OnlineDay models
        is_online_day = (
            OnlineDayYearday.objects.filter(
                month=today.month, day=today.day, employees=employee
            ).exists()
            or OnlineDayWeekday.objects.filter(
                weekday=weekday_name, employees=employee
            ).exists()
        )

        # Changed: Use employee's expected times instead of hardcoded WORK_START/END
        if not employee.expected_attend_time or not employee.expected_leave_time:
            return Response(
                {"detail": "Your work schedule is not configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Changed: Calculate grace period based on employee's expected time
        grace_end = (
            datetime.combine(today, employee.expected_attend_time)
            + timedelta(minutes=15)
        ).time()

        # Prevent duplicate check-in (unchanged)
        if AttendanceRecord.objects.filter(user=user, date=today).exists():
            return Response(
                {"detail": "Attendance already submitted for today."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Changed: Determine attendance type based on online day check
        attendance_type = "online" if is_online_day else "physical"

        # Get geolocation data from request
        employee_lat = request.data.get("latitude")
        employee_lon = request.data.get("longitude")

        # Validate geolocation for physical attendance
        if attendance_type == "physical":
            location_valid, location_message = validate_attendance_location(
                user, employee_lat, employee_lon
            )
            if not location_valid:
                return Response(
                    {"detail": location_message},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            mac_address_used = request.data.get("mac_address")
            # if not mac_address_used:
            #     return Response(
            #         {"detail": "MAC address is required for physical attendance!!!"},
            #         status=status.HTTP_400_BAD_REQUEST,
            #     )
        else:
            mac_address_used = None

        # Changed: Status determination based on employee's expected times
        if now < employee.expected_attend_time:
            return Response(
                {
                    "detail": f"You can check in after {employee.expected_attend_time.strftime('%I:%M %p')}. Try again later"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if now <= grace_end:
            status_val = "present"
        elif now > grace_end and now < employee.expected_leave_time:
            status_val = "late"
        else:
            return Response(
                {"detail": "Check-in is not allowed after end of your workday."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Record creation with geolocation data
        record = AttendanceRecord.objects.create(
            user=user,
            date=today,
            check_in_time=now,
            check_in_datetime=now_dt,
            attendance_type=attendance_type,
            status=status_val,
            mac_address=mac_address_used,
            check_in_latitude=employee_lat,
            check_in_longitude=employee_lon,
        )

        if record.status == "late" and record.lateness_hours > 0:
            employee.total_lateness_hours += record.lateness_hours
            employee.save(update_fields=["total_lateness_hours"])

        serializer = self.get_serializer(record)
        response_data = serializer.data.copy()
        if attendance_type == "physical" and location_valid:
            response_data["location_message"] = location_message

        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["patch"])
    def check_out(self, request):
        """Employee only: Record check-out for today's attendance record."""
        today = timezone.localdate()

        try:
            record = AttendanceRecord.objects.get(user=request.user, date=today)
        except AttendanceRecord.DoesNotExist:
            return Response(
                {"detail": "No attendance record found for today. Check in first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if record.check_out_time:
            return Response(
                {"detail": "Check-out already recorded for today."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get geolocation data from request
        employee_lat = request.data.get("latitude")
        employee_lon = request.data.get("longitude")

        # Validate geolocation for physical attendance
        if record.attendance_type == "physical":
            location_valid, location_message = validate_attendance_location(
                request.user, employee_lat, employee_lon
            )
            if not location_valid:
                return Response(
                    {"detail": location_message},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        now_dt = timezone.localtime()
        record.check_out_time = now_dt.time()
        record.check_out_latitude = employee_lat
        record.check_out_longitude = employee_lon
        record.save()

        can_request, reason = can_request_overtime(request.user, record)
        if can_request:
            response_data = {
                "status": "overtime_eligible",
                "message": reason,
                "attendance_record_id": record.id,
            }
            if record.attendance_type == "physical" and location_valid:
                response_data["location_message"] = location_message
            return Response(response_data, status=status.HTTP_202_ACCEPTED)

        serializer = self.get_serializer(record)
        response_data = serializer.data.copy()
        if record.attendance_type == "physical" and location_valid:
            response_data["location_message"] = location_message

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def can_request_overtime(self, request):
        """Check overtime eligibility for TODAY'S record of the current user"""
        try:
            today = timezone.localdate()
            attendance_record = AttendanceRecord.objects.get(
                user=request.user, date=today
            )

            # Manual timezone-aware check
            if attendance_record.check_out_time:
                check_out_dt = timezone.make_aware(
                    datetime.combine(today, attendance_record.check_out_time)
                )
                if timezone.localtime() < check_out_dt:
                    return Response(
                        {"detail": "Cannot request overtime before checking out"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            can_request, reason = can_request_overtime(request.user, attendance_record)
            return Response(
                {
                    "can_request": can_request,
                    "reason": reason,
                    "has_existing_request": hasattr(
                        attendance_record, "overtime_request"
                    ),
                }
            )

        except AttendanceRecord.DoesNotExist:
            return Response(
                {"detail": "No attendance record found for today"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def get_join_date(self, request):
        """Get the join date of the current user for filtering validation"""
        try:
            # Check if user has an employee profile
            if not hasattr(request.user, "employee"):
                return Response(
                    {"detail": "User does not have an employee profile"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            employee = request.user.employee
            join_date = employee.join_date
            return Response({"join_date": join_date.isoformat() if join_date else None})
        except AttributeError:
            return Response(
                {"detail": "User does not have an employee profile"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
