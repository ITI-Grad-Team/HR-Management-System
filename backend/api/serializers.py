from .models import (
    AttendanceRecord,
    OvertimeRequest,
    SalaryRecord,
)
from datetime import datetime, time
from .utils.overtime_utils import can_request_overtime
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
    Region,EducationDegree,EducationField
)
from .models import Employee, OnlineDayYearday, HolidayYearday, HolidayWeekday, OnlineDayWeekday
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


class EmployeeAcceptingSerializer(serializers.ModelSerializer):
    holiday_weekdays = serializers.ListField(
        child=serializers.CharField(), 
        write_only=True, 
        required=False,
        help_text="List of weekdays (e.g. ['Monday', 'Tuesday'])"
    )
    holiday_yeardays = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        write_only=True,
        required=False,
        help_text="List of {'month':1-12, 'day':1-31} dicts"
    )
    online_weekdays = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="List of weekdays for online work"
    )
    online_yeardays = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        write_only=True,
        required=False,
        help_text="List of {'month':1-12, 'day':1-31} for online days"
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
            "holiday_weekdays",
            "holiday_yeardays",
            "online_weekdays",
            "online_yeardays",
        ]

    def update(self, instance, validated_data):
        # Handle holiday days
        holiday_weekdays = validated_data.pop("holiday_weekdays", [])
        holiday_yeardays = validated_data.pop("holiday_yeardays", [])
        
        # Handle online days
        online_weekdays = validated_data.pop("online_weekdays", [])
        online_yeardays = validated_data.pop("online_yeardays", [])

        # Set password and save user (unchanged)
        password = "".join(random.choices(string.ascii_letters + string.digits, k=10))
        user = instance.user
        user.set_password(password)
        user.save()

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.interview_state = "accepted"
        instance.join_date = timezone.now()
        instance.save()

        # Send welcome email (unchanged)
        send_mail(
            subject="Welcome to HR",
            message=f"Your account has been created.\nUsername: {user.username}\nPassword: {password}",
            from_email="tempohr44@gmail.com",
            recipient_list=[user.username],
            fail_silently=False,
        )

        # Process holiday weekdays (using new HolidayWeekday model)
        for weekday in holiday_weekdays:
            day_obj, _ = HolidayWeekday.objects.get_or_create(weekday=weekday)
            day_obj.employees.add(instance)

        # Process holiday yeardays (using new HolidayYearday model)
        for yearday in holiday_yeardays:
            month = yearday.get("month")
            day = yearday.get("day")
            if month and day:
                day_obj, _ = HolidayYearday.objects.get_or_create(month=month, day=day)
                day_obj.employees.add(instance)

        # Process online weekdays (using new OnlineDayWeekday model)
        for weekday in online_weekdays:
            day_obj, _ = OnlineDayWeekday.objects.get_or_create(weekday=weekday)
            day_obj.employees.add(instance)

        # Process online yeardays (using new OnlineDayYearday model)
        for yearday in online_yeardays:
            month = yearday.get("month")
            day = yearday.get("day")
            if month and day:
                day_obj, _ = OnlineDayYearday.objects.get_or_create(month=month, day=day)
                day_obj.employees.add(instance)

        return instance


class EmployeeRejectingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = []


# --- Salary & Attendance System Serializers ---

class AttendanceRecordSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    user_email = serializers.EmailField(source="user.username", read_only=True)

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
    class Meta:
        model = OvertimeRequest
        fields = ["requested_hours"]  

    def validate(self, attrs):
        """Automatically fetch and validate today's attendance record"""
        request = self.context['request']
        today = timezone.localdate()
        
        try:
            attendance_record = AttendanceRecord.objects.get(
                user=request.user,
                date=today
            )
        except AttendanceRecord.DoesNotExist:
            raise serializers.ValidationError(
                "No attendance record found for today - check in first"
            )

        # Move all your existing validation logic here
        if hasattr(attendance_record, "overtime_request"):
            raise serializers.ValidationError(
                "Overtime request already exists for today"
            )

        # Use your existing can_request_overtime check
        can_request, reason = can_request_overtime(request.user, attendance_record)
        if not can_request:
            raise serializers.ValidationError(reason)

        attrs['attendance_record'] = attendance_record
        return attrs

    def create(self, validated_data):
        """Modified to use the auto-fetched attendance record"""
        attendance_record = validated_data['attendance_record']
        
        # Keep your existing overtime calculation logic
        if (hasattr(attendance_record.user, "employee") and 
            attendance_record.user.employee.expected_leave_time):
            expected_leave_time = attendance_record.user.employee.expected_leave_time

        if not attendance_record.check_out_time:
            attendance_record.check_out_time = timezone.localtime().time()
            attendance_record.save()

        if attendance_record.check_out_time > expected_leave_time:
            checkout_dt = datetime.combine(attendance_record.date, attendance_record.check_out_time)
            expected_dt = datetime.combine(attendance_record.date, expected_leave_time)
            overtime_delta = checkout_dt - expected_dt
            calculated_hours = round(overtime_delta.total_seconds() / 3600.0, 2)
            final_hours = min(validated_data["requested_hours"], calculated_hours)
        else:
            final_hours = 0

        return OvertimeRequest.objects.create(
            attendance_record=attendance_record,
            requested_hours=final_hours
        )


class OvertimeRequestApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeRequest
        fields = ["hr_comment"]


class SalaryRecordSerializer(serializers.ModelSerializer):

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
            "generated_at",
        ]


class EmployeeListSerializer(serializers.ModelSerializer):
    position = serializers.StringRelatedField()
    region = serializers.StringRelatedField()
    highest_education_degree = serializers.StringRelatedField()
    highest_education_field = serializers.StringRelatedField()
    skills = serializers.StringRelatedField(many=True)
    basic_info = BasicInfoSerializer(source='user.basicinfo')

    class Meta:
        model = Employee
        fields = [
            "id",
            "position",
            "region",
            "is_coordinator",
            "highest_education_degree",
            "highest_education_field",
            "years_of_experience",
            "percentage_of_matching_skills",
            "avg_task_rating",
            "avg_time_remaining_before_deadline",
            "avg_attendance_lateness_hrs",
            "avg_absence_days",
            "interview_state",
            "skills",
            "interview_datetime",
            "basic_info",  # Include the basic info (name and image)
        ]



class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'distance_to_work']


class EducationDegreeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationDegree
        fields = ['id', 'name']


class EducationFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationField
        fields = ['id', 'name']