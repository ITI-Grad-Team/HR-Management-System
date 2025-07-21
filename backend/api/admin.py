from django.contrib import admin

#################### Just for testing and see the right id buddyyyy! ^^ ####################
# from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
# from django.contrib.auth.models import User

# #
# # Unregister default User admin
# admin.site.unregister(User)


# # Create custom User admin
# @admin.register(User)
# class CustomUserAdmin(BaseUserAdmin):
#     list_display = ("id", "username", "email", "is_staff", "is_active")
############################################################################################

from .models import (
    BasicInfo,
    HR,
    Employee,
    Position,
    ApplicationLink,
    Skill,
    EducationField,
    EducationDegree,
    Region,
    InterviewQuestion,
    Task,
    File,
    EmployeeLeavePolicy,
    CasualLeave,
)


@admin.register(BasicInfo)
class BasicInfoAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "phone", "username")
    search_fields = ("user__username", "role", "phone", "username")


@admin.register(HR)
class HRAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "accepted_employees_avg_task_rating",
        "accepted_employees_avg_time_remaining",
        "accepted_employees_avg_lateness_hrs",
        "accepted_employees_avg_absence_days",
    )
    search_fields = ("user__username",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "phone",
        "position",
        "is_coordinator",
        "region",
        "join_date",
        "basic_salary",
    )
    search_fields = ("user__username", "phone", "position__name")
    list_filter = ("position", "is_coordinator", "region")


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(ApplicationLink)
class ApplicationLinkAdmin(admin.ModelAdmin):
    list_display = (
        "distinction_name",
        "position",
        "is_coordinator",
        "number_remaining_applicants_to_limit",
    )
    search_fields = ("distinction_name", "position__name")
    list_filter = ("is_coordinator",)


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(EducationField)
class EducationFieldAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(EducationDegree)
class EducationDegreeAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("name", "distance_to_work")
    search_fields = ("name",)


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ("employee", "text", "grade")
    search_fields = ("employee__user__username", "text")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "created_by",
        "assigned_to",
        "deadline",
        "is_submitted",
        "is_accepted",
        "is_refused",
    )
    search_fields = (
        "title",
        "created_by__user__username",
        "assigned_to__user__username",
    )
    list_filter = ("is_submitted", "is_accepted", "is_refused", "deadline")


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ("file", "task")
    search_fields = ("task__title",)


# Register EmployeeLeavePolicy
@admin.register(EmployeeLeavePolicy)
class EmployeeLeavePolicyAdmin(admin.ModelAdmin):
    list_display = ("get_employee_name", "yearly_quota", "max_days_per_request")
    search_fields = ("employee__user__username",)

    def get_employee_name(self, obj):
        return obj.employee.user.username if obj.employee and obj.employee.user else "-"

    get_employee_name.short_description = "Employee Name"


# Register CasualLeave
@admin.register(CasualLeave)
class CasualLeaveAdmin(admin.ModelAdmin):
    list_display = (
        "get_employee_name",
        "start_date",
        "end_date",
        "duration",
        "status",
        "created_at",
        "get_reviewed_by_name",
    )
    search_fields = ("employee__user__username", "status")
    list_filter = ("status", "created_at")

    def get_employee_name(self, obj):
        return obj.employee.user.username if obj.employee and obj.employee.user else "-"

    get_employee_name.short_description = "Employee Name"

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.username if obj.reviewed_by else "-"

    get_reviewed_by_name.short_description = "Reviewed By"


from django.contrib import admin
from .models import (
    AttendanceRecord,
    OvertimeRequest,
    SalaryRecord,
)


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "date",
        "attendance_type",
        "status",
        "check_in_time",
        # "check_in_datetime",
        "check_out_time",
        # "mac_address",
        "overtime_hours",
        "overtime_approved",
        "lateness_hours",
        # "get_short_time_hours",
    )
    list_filter = (
        "attendance_type",
        "status",
        "date",
        "overtime_approved",
    )  # ?date=2025-07-05 [ Add this to the url if you want to filter by a specific date]
    search_fields = ("user__username", "mac_address")

    # def get_short_time_hours(self, obj):
    #     # Calculate short time hours if check_out_time and expected_leave_time are set
    #     expected_leave = getattr(obj.user.employee, "expected_leave_time", None)
    #     if (
    #         expected_leave
    #         and obj.check_out_time
    #         and obj.check_out_time < expected_leave
    #     ):
    #         delta = (expected_leave.hour * 60 + expected_leave.minute) - (
    #             obj.check_out_time.hour * 60 + obj.check_out_time.minute
    #         )
    #         hours = delta / 60.0
    #         return round(hours, 2) if hours > 0 else 0
    #     return 0

    # get_short_time_hours.short_description = "Short Time Hours"


@admin.register(OvertimeRequest)
class OvertimeRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "attendance_user",
        "attendance_date",
        "requested_hours",
        "status",
        "reviewed_by",
        "requested_at",
        "reviewed_at",
    )
    list_filter = ("status", "requested_at", "reviewed_by")
    search_fields = ("attendance_record__user__username", "reviewed_by__username")
    readonly_fields = ("requested_at",)

    def attendance_user(self, obj):
        return obj.attendance_record.user

    attendance_user.short_description = "User"

    def attendance_date(self, obj):
        return obj.attendance_record.date

    attendance_date.short_description = "Date"


@admin.register(SalaryRecord)
class SalaryRecordAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "month",
        "year",
        "base_salary",
        "get_absent_days",
        "get_late_days",
        "get_overtime_hours",
        "final_salary",
    ]

    def get_absent_days(self, obj):
        return obj.details.get("absent_days", 0)

    get_absent_days.short_description = "Absent Days"

    def get_late_days(self, obj):
        return obj.details.get("late_days", 0)

    get_late_days.short_description = "Late Days"

    def get_overtime_hours(self, obj):
        return obj.details.get("overtime_hours", 0)

    get_overtime_hours.short_description = "Overtime Hours"
