from .models import (
    WorkDayConfig,
    PublicHoliday,
    AttendanceRecord,
    OvertimeRequest,
    SalaryRecord,
)
from datetime import datetime, time
from django.contrib.auth import get_user_model

User = get_user_model()


from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    BasicInfo,
    HR,
    Employee,
    ApplicationLink,
    Skill,
    InterviewQuestion,
    OvertimeRequest,
    Task,
    File,
    Position,
    Report,
)
from .models import Employee, HoliOrOnlineDayWeekday, HoliOrOnlineDayYearday
from django.utils import timezone
from django.core.mail import send_mail
import string, random


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class BasicInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BasicInfo
        fields = "__all__"


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = ["id", "text", "grade"]


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    basicinfo = BasicInfoSerializer(read_only=True, source="user.basicinfo")
    interview_questions = InterviewQuestionSerializer(
        source="interviewquestion_set", many=True, read_only=True
    )

    class Meta:
        model = Employee
        fields = "__all__"


class HRSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    basicinfo = BasicInfoSerializer(read_only=True, source="user.basicinfo")

    accepted_employees_avg_task_rating = serializers.FloatField(
        allow_null=True, required=False
    )
    accepted_employees_avg_time_remaining = serializers.FloatField(
        allow_null=True, required=False
    )
    accepted_employees_avg_lateness_hrs = serializers.FloatField(
        allow_null=True, required=False
    )
    accepted_employees_avg_absence_days = serializers.FloatField(
        allow_null=True, required=False
    )

    class Meta:
        model = HR
        fields = "__all__"


class ApplicationLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationLink
        fields = "__all__"


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = "__all__"


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = (
            "created_by",
            "is_submitted",
            "is_accepted",
            "is_refused",
        )  # All auto-managed fields

    def validate(self, data):
        # Manual validation for business logic
        if "deadline" in data and data["deadline"] < timezone.now():
            raise serializers.ValidationError("Deadline must be in the future")
        return data


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = "__all__"


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = "__all__"


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"


class EmployeeAcceptingSerializer(serializers.ModelSerializer):
    weekdays = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    yeardays = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Employee
        fields = [
            "id",
            "basic_salary",
            "overtime_hour_salary",
            "shorttime_hour_penalty",
            "absence_penalty",
            "expected_attend_time",
            "expected_leave_time",
            "weekdays",
            "yeardays",
        ]

    def update(self, instance, validated_data):
        weekdays = validated_data.pop("weekdays", [])
        yeardays = validated_data.pop("yeardays", [])
        password = "".join(random.choices(string.ascii_letters + string.digits, k=10))
        user = instance.user
        user.set_password(password)
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.interview_state = "accepted"
        instance.join_date = timezone.now()
        instance.save()

        send_mail(
            subject="Welcome to HR",
            message=f"Your account has been created.\nUsername: {user.username}\nPassword: {password}",
            from_email="tempohr44@gmail.com",
            recipient_list=[user.username],
            fail_silently=False,
        )

        for weekday in weekdays:
            day_obj, _ = HoliOrOnlineDayWeekday.objects.get_or_create(weekday=weekday)
            day_obj.employees.add(instance)

        for yearday in yeardays:
            month = yearday.get("month")
            day = yearday.get("day")
            if month and day:
                day_obj, _ = HoliOrOnlineDayYearday.objects.get_or_create(
                    month=month, day=day
                )
                day_obj.employees.add(instance)

        return instance


class EmployeeRejectingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = []


# --- Salary & Attendance System Serializers ---


class WorkDayConfigSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(
        source="get_weekday_display", read_only=True
    )

    class Meta:
        model = WorkDayConfig
        fields = [
            "id",
            "weekday",
            "weekday_display",
            "is_workday",
            "is_weekend",
            "is_online",
        ]


class PublicHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicHoliday
        fields = ["id", "date", "description"]


class AttendanceRecordSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "id",
            "user",
            "user_email",
            "date",
            "check_in_time",
            "check_out_time",
            "attendance_type",
            "status",
            "mac_address",
            "overtime_hours",
            "overtime_approved",
        ]

    def validate_overtime_hours(self, value):
        if value < 0:
            raise serializers.ValidationError("Overtime hours cannot be negative.")
        return round(value, 2)


class OvertimeRequestSerializer(serializers.ModelSerializer):
    user = serializers.CharField(
        source="attendance_record.user.username", read_only=True
    )
    date = serializers.DateField(source="attendance_record.date", read_only=True)
    check_out_time = serializers.TimeField(
        source="attendance_record.check_out_time", read_only=True
    )
    reviewed_by_username = serializers.CharField(
        source="reviewed_by.username", read_only=True
    )

    class Meta:
        model = OvertimeRequest
        fields = [
            "id",
            "attendance_record",
            "requested_hours",
            "status",
            "hr_comment",
            "requested_at",
            "reviewed_at",
            "reviewed_by_username",
            "user",
            "date",
            "check_out_time",
        ]
        read_only_fields = ["status", "reviewed_at", "reviewed_by"]


class OvertimeRequestCreateSerializer(serializers.ModelSerializer):
    attendance_record_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = OvertimeRequest
        fields = ["attendance_record_id", "requested_hours"]

    def validate_attendance_record_id(self, value):
        try:
            attendance_record = AttendanceRecord.objects.get(id=value)
        except AttendanceRecord.DoesNotExist:
            raise serializers.ValidationError("Attendance record not found.")

        # Check if user owns this attendance record or is coordinator with access
        user = self.context["request"].user
        if attendance_record.user != user:
            # Check if user is coordinator with access to this employee
            if not (hasattr(user, "employee") and user.employee.is_coordinator):
                raise serializers.ValidationError(
                    "You can only request overtime for your own attendance."
                )

            # Check if coordinator has access to this employee
            if (
                hasattr(attendance_record.user, "employee")
                and attendance_record.user.employee.position != user.employee.position
            ):
                raise serializers.ValidationError(
                    "You can only request overtime for employees in your position."
                )

        # Check if overtime request already exists
        if hasattr(attendance_record, "overtime_request"):
            raise serializers.ValidationError(
                "Overtime request already exists for this attendance record."
            )

        return value

    def validate_requested_hours(self, value):
        if value <= 0:
            raise serializers.ValidationError("Requested hours must be positive.")
        if value > 8:  # Maximum 8 hours overtime per day
            raise serializers.ValidationError(
                "Maximum 8 hours overtime allowed per day."
            )
        return value

    def validate(self, attrs):
        attendance_record = AttendanceRecord.objects.get(
            id=attrs["attendance_record_id"]
        )
        user = self.context["request"].user

        # Business rule: Can only request on the same calendar day
        today = timezone.localtime().date()
        if attendance_record.date != today:
            raise serializers.ValidationError(
                "You can only request overtime on the same day as attendance."
            )

        # Get employee's expected leave time (with defaults)
        expected_leave_time = time(17, 0)  # Default 5:00 PM
        if (
            hasattr(attendance_record.user, "employee")
            and attendance_record.user.employee.expected_leave_time
        ):
            expected_leave_time = attendance_record.user.employee.expected_leave_time

        # Business rule: Can only request after 30 minutes past expected leave time
        current_time = timezone.localtime().time()
        leave_plus_30min = datetime.combine(today, expected_leave_time)
        leave_plus_30min = leave_plus_30min.replace(minute=leave_plus_30min.minute + 30)
        if leave_plus_30min.minute >= 60:
            leave_plus_30min = leave_plus_30min.replace(
                hour=leave_plus_30min.hour + 1, minute=leave_plus_30min.minute - 60
            )

        if current_time < leave_plus_30min.time():
            raise serializers.ValidationError(
                f"Overtime can only be requested after {leave_plus_30min.time().strftime('%H:%M')} "
                f"(30 minutes past expected leave time)."
            )

        return attrs

    def create(self, validated_data):
        attendance_record = AttendanceRecord.objects.get(
            id=validated_data["attendance_record_id"]
        )

        # Calculate overtime hours from expected leave time
        expected_leave_time = time(17, 0)  # Default 5:00 PM
        if (
            hasattr(attendance_record.user, "employee")
            and attendance_record.user.employee.expected_leave_time
        ):
            expected_leave_time = attendance_record.user.employee.expected_leave_time

        # Use current time as check_out_time if not set
        if not attendance_record.check_out_time:
            attendance_record.check_out_time = timezone.localtime().time()
            attendance_record.save()

        # Calculate actual overtime hours
        if attendance_record.check_out_time > expected_leave_time:
            checkout_dt = datetime.combine(
                attendance_record.date, attendance_record.check_out_time
            )
            expected_dt = datetime.combine(attendance_record.date, expected_leave_time)
            overtime_delta = checkout_dt - expected_dt
            calculated_hours = round(overtime_delta.total_seconds() / 3600.0, 2)

            # Use the minimum of requested hours and calculated hours
            final_hours = min(validated_data["requested_hours"], calculated_hours)
        else:
            final_hours = 0

        return OvertimeRequest.objects.create(
            attendance_record=attendance_record, requested_hours=final_hours
        )


class OvertimeRequestApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeRequest
        fields = ["hr_comment"]


class SalaryRecordSerializer(serializers.ModelSerializer):
    absent_days = serializers.SerializerMethodField()
    late_days = serializers.SerializerMethodField()
    overtime_hours = serializers.SerializerMethodField()

    class Meta:
        model = SalaryRecord
        fields = [
            "id",
            "user",
            "month",
            "year",
            "base_salary",
            "final_salary",
            "details",
            "absent_days",
            "late_days",
            "overtime_hours",
            "generated_at",
        ]

    def get_absent_days(self, obj):
        return obj.details.get("absent_days", 0)

    def get_late_days(self, obj):
        return obj.details.get("late_days", 0)

    def get_overtime_hours(self, obj):
        return obj.details.get("overtime_hours", 0)


class EmployeeListSerializer(serializers.ModelSerializer):
    position = serializers.StringRelatedField()
    region = serializers.StringRelatedField()
    highest_education_degree = serializers.StringRelatedField()
    highest_education_field = serializers.StringRelatedField()
    skills = serializers.StringRelatedField(many=True)

    class Meta:
        model = Employee
        fields = [
            'id',
            'position',
            'region',
            'is_coordinator',
            'highest_education_degree',
            'highest_education_field',
            'years_of_experience',
            'percentage_of_matching_skills',
            'avg_task_rating',
            'avg_time_remaining_before_deadline',
            'avg_attendance_lateness_hrs',
            'avg_absence_days',
            'interview_state','skills','interview_datetime'
        ]
