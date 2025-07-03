from django.contrib import admin

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
    OvertimeClaim,
    Task,
    File,
    Report,
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


@admin.register(OvertimeClaim)
class OvertimeClaimAdmin(admin.ModelAdmin):
    list_display = ("claimer", "hours", "leave_date", "is_at_midnight")
    search_fields = ("claimer__user__username",)
    list_filter = ("is_at_midnight",)


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


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "basic_salary",
        "overtime_hour_salary",
        "shorttime_hour_penalty",
        "absence_penalty",
        "month",
        "total",
    )
    search_fields = ("employee__user__username", "month")
    list_filter = ("month",)


from django.contrib import admin
from .models import (
    WorkDayConfig,
    PublicHoliday,
    AttendanceRecord,
    OvertimeRequest,
    SalaryRecord,
)


@admin.register(WorkDayConfig)
class WorkDayConfigAdmin(admin.ModelAdmin):
    list_display = ("weekday", "is_workday", "is_weekend", "is_online")
    list_filter = ("is_workday", "is_weekend", "is_online")
    search_fields = ("weekday",)


@admin.register(PublicHoliday)
class PublicHolidayAdmin(admin.ModelAdmin):
    list_display = ("date", "description")
    search_fields = ("description",)
    list_filter = ("date",)


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "date",
        "attendance_type",
        "status",
        "check_in_time",
        "check_in_datetime",
        "check_out_time",
        "mac_address",
        "overtime_hours",
        "overtime_approved",
    )
    list_filter = ("attendance_type", "status", "date", "overtime_approved")
    search_fields = ("user__username", "mac_address")


@admin.register(OvertimeRequest)
class OvertimeRequestAdmin(admin.ModelAdmin):
    list_display = (
        "attendance_record",
        "requested_hours",
        "status",
        "requested_at",
        "reviewed_at",
    )
    list_filter = ("status", "requested_at", "reviewed_at")
    search_fields = ("attendance_record__user__username",)


@admin.register(SalaryRecord)
class SalaryRecordAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "month",
        "year",
        "base_salary",
        "absent_days",
        "late_days",
        "overtime_hours",
        "final_salary",
        "generated_at",
    )
    list_filter = ("year", "month")
    search_fields = ("user__username",)


from django.contrib import admin

# Register your models here.
