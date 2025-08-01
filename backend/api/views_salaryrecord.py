from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.models import AttendanceRecord, OvertimeRequest, SalaryRecord, Employee
from api.serializers import SalaryRecordSerializer
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from .permissions import IsHRorAdmin
from django.db.models import Q
from django.contrib.auth import get_user_model
from datetime import date
from .views import TenPerPagePagination

User = get_user_model()


class SalaryRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsHRorAdmin]
    queryset = SalaryRecord.objects.select_related("user__employee__position").all()
    serializer_class = SalaryRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "year", "month"]
    pagination_class = TenPerPagePagination

    @action(
        detail=False, methods=["get"], url_path="available-periods/(?P<user_id>[^/.]+)"
    )
    def available_periods(self, request, user_id=None):
        """
        Get available year/month combinations for salary record generation
        based on the employee's join date up to current date.
        """
        try:
            user = User.objects.get(pk=user_id)
            employee = getattr(user, "employee", None)

            if not employee or not employee.join_date:
                return Response(
                    {"detail": "Employee join date not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            join_date = employee.join_date
            current_date = date.today()

            # Generate available periods from join date to current date
            periods = []
            current_year = join_date.year
            current_month = join_date.month

            while current_year < current_date.year or (
                current_year == current_date.year
                and current_month <= current_date.month
            ):
                periods.append(
                    {
                        "year": current_year,
                        "month": current_month,
                        "label": f"{current_year}-{current_month:02d}",
                    }
                )

                current_month += 1
                if current_month > 12:
                    current_month = 1
                    current_year += 1

            # Get available years (unique from periods)
            available_years = sorted(list(set(period["year"] for period in periods)))

            return Response(
                {
                    "periods": periods,
                    "years": available_years,
                    "join_date": join_date,
                    "current_date": current_date,
                }
            )

        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"detail": f"Error retrieving available periods: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def create(self, request, *args, **kwargs):
        # Accept both "user" and "user_id" for compatibility
        user_value = request.data.get("user") or request.data.get("user_id")
        year = int(request.data.get("year"))
        month = int(request.data.get("month"))
        UserModel = get_user_model()
        user = None
        if user_value is not None:
            # Try integer PK first
            try:
                user = UserModel.objects.get(pk=int(user_value))
            except (ValueError, TypeError):
                # Not an int, try username/email
                try:
                    user = UserModel.objects.get(username=user_value)
                except UserModel.DoesNotExist:
                    try:
                        user = UserModel.objects.get(email=user_value)
                    except UserModel.DoesNotExist:
                        return Response(
                            {"detail": "User not found."},
                            status=status.HTTP_404_NOT_FOUND,
                        )
            except UserModel.DoesNotExist:
                # int(user_value) succeeded but no user with that PK
                return Response(
                    {"detail": "User not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            return Response(
                {"detail": "User not specified."}, status=status.HTTP_400_BAD_REQUEST
            )
        employee = getattr(user, "employee", None)
        if not employee or employee.basic_salary is None:
            return Response(
                {"detail": "User does not have a base salary set."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        base_salary = float(employee.basic_salary or 0)
        absence_penalty = float(employee.absence_penalty or 0)
        shorttime_hour_penalty = float(employee.shorttime_hour_penalty or 0)
        overtime_hour_salary = float(employee.overtime_hour_salary or 0)

        # Check for existing SalaryRecord
        if SalaryRecord.objects.filter(user=user, year=year, month=month).exists():
            # Delete existing records for this user/month/year
            SalaryRecord.objects.filter(user=user, year=year, month=month).delete()
            print(
                f"Deleted existing salary record for {user.username} - {month}/{year}"
            )

        records = AttendanceRecord.objects.filter(
            user=user, date__year=year, date__month=month
        )
        absent_days = records.filter(status="absent").count()
        late_days = records.filter(status="late").count()
        lateness_hours = (
            records.filter(status="late").aggregate(total=models.Sum("lateness_hours"))[
                "total"
            ]
            or 0
        )
        # Overtime: sum overtime_hours from AttendanceRecord where overtime_approved=True and overtime_hours > 0
        overtime_hours = (
            records.filter(overtime_approved=True, overtime_hours__gt=0).aggregate(
                total=models.Sum("overtime_hours")
            )["total"]
            or 0
        )
        # Short time: sum short_time_hours where check_out_time is before expected_leave_time
        # short_time_hours = 0
        # short_time_penalty_total = 0
        # for rec in records:
        #     # Only count if expected_leave_time and check_out_time are set
        #     expected_leave = getattr(rec.user.employee, "expected_leave_time", None)
        #     if (
        #         expected_leave
        #         and rec.check_out_time
        #         and rec.check_out_time < expected_leave
        #     ):
        #         # Calculate short time in hours
        #         delta = (expected_leave.hour * 60 + expected_leave.minute) - (
        #             rec.check_out_time.hour * 60 + rec.check_out_time.minute
        #         )
        #         hours = delta / 60.0
        #         if hours > 0:
        #             short_time_hours += hours
        # short_time_hours = round(short_time_hours, 2)
        # short_time_penalty_total = round(short_time_hours * shorttime_hour_penalty, 2)

        absent_penalty_total = absent_days * absence_penalty
        late_penalty_total = lateness_hours * shorttime_hour_penalty
        overtime_bonus_total = overtime_hours * overtime_hour_salary
        # if you ever want to add short time, put it in dedcutions (short_time_penalty_total)
        total_deductions = absent_penalty_total + late_penalty_total
        final_salary = round(
            base_salary - total_deductions + overtime_bonus_total,
            2,
        )

        details = {
            "absent_days": absent_days,
            "late_days": late_days,
            "lateness_hours": round(lateness_hours, 2),
            "overtime_hours": round(overtime_hours, 2),
            "absence_day_penalty": absence_penalty,
            "shorttime_hour_penalty": shorttime_hour_penalty,
            "overtime_hour_salary": overtime_hour_salary,
            "total_absence_penalty": round(absent_penalty_total, 2),
            "total_late_penalty": round(late_penalty_total, 2),
            # "short_time_hours": short_time_hours,
            # "short_time_penalty": short_time_penalty_total,
            "total_deductions": round(total_deductions, 2),
            "total_overtime_salary": round(overtime_bonus_total, 2),
        }

        salary_record = SalaryRecord.objects.create(
            user=user,
            year=year,
            month=month,
            base_salary=round(base_salary, 2),
            final_salary=final_salary,
            details=details,
        )
        serializer = SalaryRecordSerializer(salary_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
