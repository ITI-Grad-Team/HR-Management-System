from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.models import AttendanceRecord, OvertimeRequest, SalaryRecord
from api.serializers import SalaryRecordSerializer
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend


class SalaryRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = SalaryRecord.objects.all()
    serializer_class = SalaryRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "year", "month"]

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
            return Response(
                {"detail": "Salary already calculated for this month"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        records = AttendanceRecord.objects.filter(
            user=user, date__year=year, date__month=month
        )
        absent_days = records.filter(status="absent").count()
        late_days = records.filter(status="late").count()
        # Overtime: sum overtime_hours from AttendanceRecord where overtime_approved=True and overtime_hours > 0
        overtime_hours = (
            records.filter(overtime_approved=True, overtime_hours__gt=0).aggregate(
                total=models.Sum("overtime_hours")
            )["total"]
            or 0
        )

        absent_penalty_total = absent_days * absence_penalty
        late_penalty_total = late_days * shorttime_hour_penalty
        overtime_bonus_total = overtime_hours * overtime_hour_salary
        final_salary = round(
            base_salary
            - absent_penalty_total
            - late_penalty_total
            + overtime_bonus_total,
            2,
        )

        details = {
            "absent_days": absent_days,
            "late_days": late_days,
            "overtime_hours": round(overtime_hours, 2),
            "absence_penalty": absence_penalty,
            "shorttime_hour_penalty": shorttime_hour_penalty,
            "overtime_hour_salary": overtime_hour_salary,
            "absent_penalty": round(absent_penalty_total, 2),
            "late_penalty": round(late_penalty_total, 2),
            "overtime_bonus": round(overtime_bonus_total, 2),
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
