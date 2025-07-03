from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.models import AttendanceRecord, OvertimeRequest
from django.db import models


class SalaryRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["post"]  # Only allow POST for now
    queryset = []  # Not used, as we don't list or retrieve yet

    def create(self, request, *args, **kwargs):
        user_id = request.data.get("user_id")
        year = int(request.data.get("year"))
        month = int(request.data.get("month"))
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            employee = getattr(user, "employee", None)
            if not employee or employee.basic_salary is None:
                return Response(
                    {"detail": "User does not have a base salary set."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            base_salary = float(employee.basic_salary)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
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

        return Response(
            {
                "base_salary": round(base_salary, 2),
                "absent_days": absent_days,
                "late_days": late_days,
                "overtime_hours": round(overtime_hours, 2),
                "final_salary": final_salary,
            }
        )
