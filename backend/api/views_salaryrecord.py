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
        user_id = request.data.get("user") or request.data.get("user_id")
        year = int(request.data.get("year"))
        month = int(request.data.get("month"))
        UserModel = get_user_model()
        user = None
        # Try to fetch by integer ID or username/email fallback
        if user_id is not None:
            try:
                # Try integer ID
                user = UserModel.objects.get(pk=int(user_id))
            except (UserModel.DoesNotExist, ValueError, TypeError):
                # Try username or email if pk lookup fails
                try:
                    user = UserModel.objects.get(username=user_id)
                except UserModel.DoesNotExist:
                    try:
                        user = UserModel.objects.get(email=user_id)
                    except UserModel.DoesNotExist:
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
        base_salary = float(employee.basic_salary)

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
        overtime_hours = (
            OvertimeRequest.objects.filter(
                attendance_record__user=user,
                attendance_record__date__year=year,
                attendance_record__date__month=month,
                status="approved",
            ).aggregate(total=models.Sum("requested_hours"))["total"]
            or 0
        )

        daily_wage = base_salary / 30
        hourly_rate = daily_wage / 8
        absent_penalty = daily_wage * absent_days
        late_penalty = 0.25 * daily_wage * late_days
        overtime_bonus = hourly_rate * overtime_hours
        final_salary = round(
            base_salary - absent_penalty - late_penalty + overtime_bonus, 2
        )

        salary_record = SalaryRecord.objects.create(
            user=user,
            year=year,
            month=month,
            base_salary=round(base_salary, 2),
            absent_days=absent_days,
            late_days=late_days,
            overtime_hours=round(overtime_hours, 2),
            final_salary=final_salary,
            details={
                "absent_penalty": round(absent_penalty, 2),
                "late_penalty": round(late_penalty, 2),
                "overtime_bonus": round(overtime_bonus, 2),
                "daily_wage": round(daily_wage, 2),
                "hourly_rate": round(hourly_rate, 2),
            },
        )
        serializer = SalaryRecordSerializer(salary_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
