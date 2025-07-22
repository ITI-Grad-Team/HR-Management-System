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
    Region,
    EducationDegree,
    EducationField,
    CompanyStatistics,
)
from .models import (
    Employee,
    OnlineDayYearday,
    HolidayYearday,
    HolidayWeekday,
    OnlineDayWeekday,
)
from django.utils import timezone
from django.core.mail import send_mail
import string, random
from .models import CasualLeave, EmployeeLeavePolicy
from .supabase_utils import upload_to_supabase


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class BasicInfoSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(
        required=False,
        allow_null=True,
        max_length=None,
        write_only=True,
    )
    profile_image_url = serializers.CharField(read_only=True)
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )

    class Meta:
        model = BasicInfo
        fields = ["profile_image", "profile_image_url", "phone", "role", "username"]
        extra_kwargs = {
            "role": {
                "read_only": True
            }  # Keep role read-only if it shouldn't be changed
        }

    def validate_username(self, value):
        """Ensure username is unique and valid when provided"""
        if value and value != self.instance.username:
            if BasicInfo.objects.filter(username__iexact=value).exists():
                raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_phone(self, value):
        """Add phone number validation if needed"""
        if value:
            # Add any phone number format validation here
            value = value.strip()
        return value

    def update(self, instance, validated_data):
        """Handle profile image updates efficiently"""
        profile_image = validated_data.pop("profile_image", None)

        # Delete old image if new one is provided or if null is explicitly set
        if profile_image:
            # ارفع الصورة على Supabase
            url = upload_to_supabase(
                "profile-images", profile_image, profile_image.name
            )
            instance.profile_image_url = url

        return super().update(instance, validated_data)


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = ["id", "text", "grade"]


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    basicinfo = BasicInfoSerializer(read_only=True, source="user.basicinfo")
    # Display names instead of IDs for related fields
    position = serializers.StringRelatedField()
    region = serializers.StringRelatedField()
    highest_education_degree = serializers.StringRelatedField()
    highest_education_field = serializers.StringRelatedField()

    # For ManyToMany fields (skills)
    skills = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")

    # Holiday and Online day fields
    yearly_holidays = serializers.SerializerMethodField()
    weekly_holidays = serializers.SerializerMethodField()
    yearly_online_days = serializers.SerializerMethodField()
    weekly_online_days = serializers.SerializerMethodField()

    # Computed fields
    avg_task_ratings = serializers.FloatField(read_only=True)
    avg_time_remaining_before_deadline = serializers.FloatField(read_only=True)
    avg_overtime_hours = serializers.FloatField(read_only=True)
    avg_lateness_hours = serializers.FloatField(read_only=True)
    avg_absent_days = serializers.FloatField(read_only=True)

    cv = serializers.FileField(write_only=True, required=False, allow_null=True)
    cv_url = serializers.CharField(read_only=True)

    class Meta:
        model = Employee
        fields = "__all__"

    def create(self, validated_data):
        cv_file = validated_data.pop("cv", None)

        # إنشاء الـ instance
        instance = Employee.objects.create(**validated_data)

        # رفع الملف لو موجود
        if cv_file:
            instance.temp_cv = cv_file

        instance.save()
        return instance

    def update(self, instance, validated_data):
        cv_file = validated_data.pop("cv", None)

        # باقي البيانات
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # رفع الملف لو موجود
        if cv_file:
            instance.temp_cv = cv_file

        instance.save()
        return instance

    def get_yearly_holidays(self, obj):
        return [{"month": h.month, "day": h.day} for h in obj.holidayyearday_set.all()]

    def get_weekly_holidays(self, obj):
        return [h.weekday for h in obj.holidayweekday_set.all()]

    def get_yearly_online_days(self, obj):
        return [
            {"month": o.month, "day": o.day} for o in obj.onlinedayyearday_set.all()
        ]

    def get_weekly_online_days(self, obj):
        return [o.weekday for o in obj.onlinedayweekday_set.all()]


class HRSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    user = UserSerializer(read_only=True)
    basicinfo = BasicInfoSerializer(read_only=True, source="user.basicinfo")
    accepted_employees_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = HR
        fields = [
            "id",
            "user",
            "basicinfo",
            "accepted_employees_avg_task_rating",
            "accepted_employees_avg_time_remaining",
            "accepted_employees_avg_lateness_hrs",
            "accepted_employees_avg_absence_days",
            "accepted_employees_avg_salary",
            "accepted_employees_avg_overtime",
            "accepted_employees_avg_interviewer_rating",
            "interviewer_rating_to_task_rating_correlation",
            "interviewer_rating_to_time_remaining_correlation",
            "interviewer_rating_to_lateness_hrs_correlation",
            "interviewer_rating_to_absence_days_correlation",
            "interviewer_rating_to_avg_overtime_correlation",
            "accepted_employees_count",
            "last_stats_calculation_time",
        ]
        read_only_fields = fields


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


class EmployeeForTaskSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.basicinfo.username", read_only=True)
    phone = serializers.CharField(source="user.basicinfo.phone", read_only=True)
    profile_image = serializers.CharField(
        source="user.basicinfo.profile_image_url", read_only=True
    )
    email = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Employee
        fields = ["id", "username", "phone", "profile_image", "email"]


# serializers.py
class FileSerializer(serializers.ModelSerializer):
    temp_file = serializers.FileField(write_only=True)

    class Meta:
        model = File
        fields = ["id", "file_url", "temp_file"]
        read_only_fields = ["file_url"]

    def create(self, validated_data):
        temp_file = validated_data.pop("temp_file")
        instance = File(**validated_data)
        instance.temp_file = temp_file
        instance.save()
        return instance


class TaskSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    assigned_to = serializers.SerializerMethodField()
    files = FileSerializer(many=True, read_only=True, source="file_set")

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("created_by", "is_submitted", "is_accepted", "is_refused")

    def get_created_by(self, obj):
        return self._get_employee_data(obj.created_by)

    def get_assigned_to(self, obj):
        return self._get_employee_data(obj.assigned_to)

    def _get_employee_data(self, employee):
        if not employee:
            return None

        return {
            "id": employee.id,
            "username": employee.user.basicinfo.username,
            "phone": employee.user.basicinfo.phone,
            "profile_image_url": employee.user.basicinfo.profile_image_url,  # Supabase URL directly
            "email": employee.user.username,
        }


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
        help_text="List of weekdays (e.g. ['Monday', 'Tuesday'])",
    )
    holiday_yeardays = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        write_only=True,
        required=False,
        help_text="List of {'month':1-12, 'day':1-31} dicts",
    )
    online_weekdays = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="List of weekdays for online work",
    )
    online_yeardays = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        write_only=True,
        required=False,
        help_text="List of {'month':1-12, 'day':1-31} for online days",
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
        holiday_weekdays = validated_data.pop("holiday_weekdays", None)
        holiday_yeardays = validated_data.pop("holiday_yeardays", None)

        # Handle online days
        online_weekdays = validated_data.pop("online_weekdays", None)
        online_yeardays = validated_data.pop("online_yeardays", None)

        if instance.interview_state == "done":
            # Only do acceptance workflow if not already accepted
            password = "".join(
                random.choices(string.ascii_letters + string.digits, k=10)
            )
            user = instance.user
            user.set_password(password)
            user.save()

            instance.interview_state = "accepted"
            instance.join_date = timezone.now()

            # Send welcome email only for new acceptance
            send_mail(
                subject="Welcome to HR",
                message=f"Your account has been created.\nUsername: {user.username}\nPassword: {password}",
                from_email="tempohr44@gmail.com",
                recipient_list=[user.username],
                fail_silently=False,
            )

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # Process holiday weekdays if provided
        if holiday_weekdays is not None:
            instance.holidayweekday_set.clear()
            for weekday in holiday_weekdays:
                day_obj, _ = HolidayWeekday.objects.get_or_create(weekday=weekday)
                day_obj.employees.add(instance)

        # Process holiday yeardays if provided
        if holiday_yeardays is not None:
            instance.holidayyearday_set.clear()
            for yearday in holiday_yeardays:
                month = yearday.get("month")
                day = yearday.get("day")
                if month and day:
                    day_obj, _ = HolidayYearday.objects.get_or_create(
                        month=month, day=day
                    )
                    day_obj.employees.add(instance)

        # Process online weekdays if provided
        if online_weekdays is not None:
            instance.onlinedayweekday_set.clear()
            for weekday in online_weekdays:
                day_obj, _ = OnlineDayWeekday.objects.get_or_create(weekday=weekday)
                day_obj.employees.add(instance)

        # Process online yeardays if provided
        if online_yeardays is not None:
            instance.onlinedayyearday_set.clear()
            for yearday in online_yeardays:
                month = yearday.get("month")
                day = yearday.get("day")
                if month and day:
                    day_obj, _ = OnlineDayYearday.objects.get_or_create(
                        month=month, day=day
                    )
                    day_obj.employees.add(instance)

        return instance


class EmployeeRejectingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = []


# --- Salary & Attendance System Serializers ---


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


class AttendanceRecordSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    user_email = serializers.EmailField(source="user.username", read_only=True)
    overtime_request = OvertimeRequestSerializer(read_only=True)
    lateness_hours = serializers.FloatField(read_only=True)

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
            "overtime_request",
            "lateness_hours",
            "check_in_latitude",
            "check_in_longitude",
            "check_out_latitude",
            "check_out_longitude",
        ]

    def validate_overtime_hours(self, value):
        if value < 0:
            raise serializers.ValidationError("Overtime hours cannot be negative.")
        return round(value, 2)


class OvertimeRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeRequest
        fields = ["requested_hours"]

    def validate(self, attrs):
        """Automatically fetch and validate today's attendance record"""
        request = self.context["request"]
        today = timezone.localdate()

        try:
            attendance_record = AttendanceRecord.objects.get(
                user=request.user, date=today
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

        attrs["attendance_record"] = attendance_record
        return attrs

    def create(self, validated_data):
        """Modified to use the auto-fetched attendance record"""
        attendance_record = validated_data["attendance_record"]

        # Keep your existing overtime calculation logic
        if (
            hasattr(attendance_record.user, "employee")
            and attendance_record.user.employee.expected_leave_time
        ):
            expected_leave_time = attendance_record.user.employee.expected_leave_time

        if not attendance_record.check_out_time:
            attendance_record.check_out_time = timezone.localtime().time()
            attendance_record.save()

        if attendance_record.check_out_time > expected_leave_time:
            checkout_dt = datetime.combine(
                attendance_record.date, attendance_record.check_out_time
            )
            expected_dt = datetime.combine(attendance_record.date, expected_leave_time)
            overtime_delta = checkout_dt - expected_dt
            calculated_hours = round(overtime_delta.total_seconds() / 3600.0, 2)
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


class EmployeeTakenListSerializer(serializers.ModelSerializer):
    position = serializers.CharField(source="position.name", read_only=True)
    region = serializers.CharField(source="region.name", read_only=True)
    user = UserSerializer(read_only=True)
    basic_info = BasicInfoSerializer(source="user.basicinfo", read_only=True)
    highest_education_field = serializers.CharField(
        source="highest_education_field.name", read_only=True
    )
    application_link = serializers.CharField(
        source="application_link.distinction_name", read_only=True
    )

    class Meta:
        model = Employee
        fields = [
            "id",
            "position",
            "region",
            "is_coordinator",
            "user",
            "basic_info",
            "highest_education_field",
            "years_of_experience",
            "application_link",'interview_state'
        ]

class EmployeeListSerializer(serializers.ModelSerializer):
    position = serializers.CharField(source="position.name", read_only=True)
    region = serializers.CharField(source="region.name", read_only=True)
    user = UserSerializer(read_only=True)
    basic_info = BasicInfoSerializer(source="user.basicinfo", read_only=True)
    highest_education_field = serializers.CharField(
        source="highest_education_field.name", read_only=True
    )
    application_link = serializers.CharField(
        source="application_link.distinction_name", read_only=True
    )

    class Meta:
        model = Employee
        fields = [
            "id",
            "position",
            "region",
            "is_coordinator",
            "user",
            "basic_info",
            "highest_education_field",
            "years_of_experience",
            "application_link",
        ]


class SalaryRecordSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    employee_position = serializers.CharField(
        source="user.employee.position.name", read_only=True
    )
    employee_id = serializers.IntegerField(source="user.employee.id", read_only=True)

    class Meta:
        model = SalaryRecord
        fields = [
            "id",
            "user",
            "employee_position",
            "employee_id",
            "month",
            "year",
            "base_salary",
            "final_salary",
            "details",
            "generated_at",
        ]


class EmployeeInterviewListSerializer(EmployeeListSerializer):
    time_until_interview = serializers.SerializerMethodField()
    interview_datetime = serializers.DateTimeField()

    class Meta(EmployeeListSerializer.Meta):
        fields = EmployeeListSerializer.Meta.fields + [
            "interview_datetime",
            "time_until_interview",
        ]

    def get_time_until_interview(self, obj):
        # Access the annotated field if available
        if hasattr(obj, "time_until_interview"):
            return str(obj.time_until_interview)
        if obj.interview_datetime:
            return str(obj.interview_datetime - timezone.now())
        return None


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = [
            "id",
            "name",
            "distance_to_work",
            "latitude",
            "longitude",
            "allowed_radius_meters",
        ]


class EducationDegreeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationDegree
        fields = ["id", "name"]


class EducationFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationField
        fields = ["id", "name"]


class CompanyStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyStatistics
        fields = "__all__"


class HRListSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    basic_info = BasicInfoSerializer(source="user.basicinfo", read_only=True)

    class Meta:
        model = HR
        fields = ["id", "user", "basic_info"]


class EmployeeCVUpdateSerializer(serializers.ModelSerializer):
    skills = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Skill.objects.all(), required=False
    )

    class Meta:
        model = Employee
        fields = [
            "region",
            "highest_education_degree",
            "highest_education_field",
            "years_of_experience",
            "had_leadership_role",
            "percentage_of_matching_skills",
            "has_position_related_high_education",
            "skills",
        ]
        extra_kwargs = {
            "region": {"required": True},
            "highest_education_degree": {"required": True},
            "highest_education_field": {"required": True},
            "years_of_experience": {"required": True},
        }

    def validate_years_of_experience(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Years of experience cannot be negative")
        return value


class CasualLeaveSerializer(serializers.ModelSerializer):
    employee = EmployeeListSerializer(read_only=True)
    duration = serializers.IntegerField(read_only=True)

    class Meta:
        model = CasualLeave
        fields = "__all__"

    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError("Start date cannot be after end date.")

        if start_date and start_date < timezone.now().date():
            raise serializers.ValidationError("Cannot request leave for a past date.")

        return data

    def create(self, validated_data):
        # Duration will be auto-calculated in the model's save method
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Duration will be auto-calculated in the model's save method
        return super().update(instance, validated_data)


class CasualLeaveListSerializer(serializers.ModelSerializer):
    """
    OPTIMIZED: Lightweight serializer for list views with minimal data
    """

    employee_name = serializers.CharField(
        source="employee.user.basicinfo.username", read_only=True
    )
    employee_position = serializers.CharField(
        source="employee.position.name", read_only=True
    )
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.username", read_only=True
    )
    duration = serializers.IntegerField(read_only=True)

    class Meta:
        model = CasualLeave
        fields = [
            "id",
            "start_date",
            "end_date",
            "duration",
            "status",
            "created_at",
            "reason",
            "rejection_reason",
            "employee_name",
            "employee_position",
            "reviewed_by_name",
        ]


class EmployeeLeavePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeLeavePolicy
        fields = "__all__"
