from django.db import models
from django.conf import settings
import datetime
from django.db.models import Sum, Avg
from django.db.models.functions import Cast
from django.db.models import FloatField
import pandas as pd
from django.utils import timezone
from .supabase_utils import upload_to_supabase


class AttendanceRecord(models.Model):
    ATTENDANCE_TYPE_CHOICES = [
        ("physical", "Physical"),
        ("online", "Online"),
    ]
    STATUS_CHOICES = [
        ("present", "Present"),
        ("late", "Late"),
        ("absent", "Absent"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    check_in_time = models.TimeField(null=True, blank=True)
    check_in_datetime = models.DateTimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    attendance_type = models.CharField(max_length=10, choices=ATTENDANCE_TYPE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    mac_address = models.CharField(max_length=50, null=True, blank=True)
    lateness_hours = models.FloatField(default=0)
    overtime_hours = models.FloatField(default=0)
    overtime_approved = models.BooleanField(default=False)
    # Geolocation fields for attendance validation
    check_in_latitude = models.FloatField(
        null=True, blank=True, help_text="Employee's latitude during check-in"
    )
    check_in_longitude = models.FloatField(
        null=True, blank=True, help_text="Employee's longitude during check-in"
    )
    check_out_latitude = models.FloatField(
        null=True, blank=True, help_text="Employee's latitude during check-out"
    )
    check_out_longitude = models.FloatField(
        null=True, blank=True, help_text="Employee's longitude during check-out"
    )

    class Meta:
        unique_together = ("user", "date")
        indexes = [
            models.Index(fields=["user", "date"]),
            models.Index(fields=["date", "status"]),
            models.Index(fields=["overtime_approved", "overtime_hours"]),
            models.Index(fields=["-date"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.date} ({self.status})"

    def save(self, *args, **kwargs):
        # Calculate lateness_hours before saving
        if self.check_in_time and hasattr(self.user, "employee"):
            expected_time = self.user.employee.expected_attend_time
            if expected_time:
                check_in_dt = datetime.datetime.combine(self.date, self.check_in_time)
                expected_dt = datetime.datetime.combine(self.date, expected_time)
                grace_dt = expected_dt + datetime.timedelta(
                    minutes=15
                )  # 15-minute grace period

                # Only calculate lateness if check-in is after grace period
                if check_in_dt > grace_dt:
                    lateness_seconds = (check_in_dt - grace_dt).total_seconds()
                    self.lateness_hours = round(lateness_seconds / 3600, 2)
                else:
                    self.lateness_hours = 0.0

        super().save(*args, **kwargs)


class OvertimeRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    attendance_record = models.OneToOneField(
        "AttendanceRecord", on_delete=models.CASCADE, related_name="overtime_request"
    )
    requested_hours = models.FloatField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    hr_comment = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_overtime_requests",
    )

    def __str__(self):
        return f"Overtime {self.requested_hours}h for {self.attendance_record.user} on {self.attendance_record.date} ({self.status})"

    class Meta:
        ordering = ["-requested_at"]
        indexes = [
            models.Index(fields=["status", "reviewed_at"]),
            models.Index(fields=["status", "-requested_at"]),
            models.Index(fields=["-reviewed_at"]),
        ]


class SalaryRecord(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    base_salary = models.FloatField()
    final_salary = models.FloatField()
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Snapshot of all salary factors for this month.",
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "month", "year")

    def __str__(self):
        return f"Salary for {self.user} - {self.month}/{self.year}: {self.final_salary}"

    @property
    def summary(self):
        """Return a summary of the main salary components for display/reporting."""
        d = self.details or {}
        return {
            "base_salary": self.base_salary,
            "final_salary": self.final_salary,
            "absent_days": d.get("absent_days"),
            "late_days": d.get("late_days"),
            "overtime_hours": d.get("overtime_hours"),
            "absent_penalty": d.get("absent_penalty"),
            "late_penalty": d.get("late_penalty"),
            "overtime_bonus": d.get("overtime_bonus"),
            "other": {
                k: v
                for k, v in d.items()
                if k
                not in {
                    "absent_days",
                    "late_days",
                    "overtime_hours",
                    "absent_penalty",
                    "late_penalty",
                    "overtime_bonus",
                }
            },
        }


class BasicInfo(models.Model):
    profile_image_url = models.CharField(max_length=1000, blank=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=20)
    username = models.CharField(max_length=150, blank=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    temp_profile_image = None

    def save(self, *args, **kwargs):
        if self.temp_profile_image:
            self.profile_image_url = upload_to_supabase(
                "profile-images", self.temp_profile_image, self.temp_profile_image.name
            )
        super().save(*args, **kwargs)


class HR(models.Model):
    rank = models.IntegerField(null=True, blank=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    accepted_employees_avg_task_rating = models.FloatField(null=True, blank=True)
    accepted_employees_avg_time_remaining = models.FloatField(null=True, blank=True)
    accepted_employees_avg_lateness_hrs = models.FloatField(null=True, blank=True)
    accepted_employees_avg_absence_days = models.FloatField(null=True, blank=True)
    accepted_employees_avg_salary = models.FloatField(null=True, blank=True)
    accepted_employees_avg_overtime = models.FloatField(null=True, blank=True)
    accepted_employees_avg_interviewer_rating = models.FloatField(null=True, blank=True)
    interviewer_rating_to_task_rating_correlation = models.FloatField(
        null=True, blank=True
    )
    interviewer_rating_to_time_remaining_correlation = models.FloatField(
        null=True, blank=True
    )
    interviewer_rating_to_lateness_hrs_correlation = models.FloatField(
        null=True, blank=True
    )
    interviewer_rating_to_absence_days_correlation = models.FloatField(
        null=True, blank=True
    )
    interviewer_rating_to_avg_overtime_correlation = models.FloatField(
        null=True, blank=True
    )
    last_stats_calculation_time = models.DateTimeField(null=True, blank=True)

    @property
    def accepted_employees(self):
        """Returns queryset of employees this HR has accepted"""
        return Employee.objects.filter(interviewer=self, interview_state="accepted")

    @property
    def accepted_employees_count(self):
        return self.accepted_employees.count()

    def calculate_accepted_employees_stats(self):
        """Updates all average and correlation fields"""

        accepted = self.accepted_employees
        count = accepted.count()

        if count == 0:
            print("\n Found No Employees")

            # Reset all fields
            self.accepted_employees_avg_task_rating = None
            self.accepted_employees_avg_time_remaining = None
            self.accepted_employees_avg_lateness_hrs = None
            self.accepted_employees_avg_absence_days = None
            self.accepted_employees_avg_salary = None
            self.accepted_employees_avg_overtime = None
            self.accepted_employees_avg_interviewer_rating = None

            # Reset correlation fields
            self.interviewer_rating_to_task_rating_correlation = None
            self.interviewer_rating_to_time_remaining_correlation = None
            self.interviewer_rating_to_lateness_hrs_correlation = None
            self.interviewer_rating_to_absence_days_correlation = None
            self.interviewer_rating_to_avg_overtime_correlation = None
        else:
            print("\n Found Employees")
            # Get all aggregates
            aggregates = accepted.aggregate(
                total_ratings=Sum("total_task_ratings"),
                total_tasks=Sum("number_of_accepted_tasks"),
                total_time=Sum("total_time_remaining_before_deadline"),
                total_lateness=Sum("total_lateness_hours"),
                total_absence=Sum("total_absent_days"),
                avg_salary=Avg("basic_salary"),
                total_overtime=Sum("total_overtime_hours"),
                total_days=Sum("number_of_non_holiday_days_since_join"),
                avg_interviewer_rating=Avg("interviewer_rating"),
            )

            # Calculate averages
            total_tasks = aggregates.get("total_tasks") or 0
            total_days = aggregates.get("total_days") or 0

            self.accepted_employees_avg_task_rating = (
                round(aggregates["total_ratings"] / total_tasks, 2)
                if total_tasks > 0
                else None
            )
            self.accepted_employees_avg_time_remaining = (
                round(aggregates["total_time"] / total_tasks, 2)
                if total_tasks > 0
                else None
            )
            self.accepted_employees_avg_lateness_hrs = (
                round(aggregates["total_lateness"] / total_days, 2)
                if total_days > 0
                else None
            )
            self.accepted_employees_avg_absence_days = (
                round(aggregates["total_absence"] / total_days, 2)
                if total_days > 0
                else None
            )
            self.accepted_employees_avg_salary = (
                round(aggregates.get("avg_salary"), 2)
                if aggregates.get("avg_salary") is not None
                else None
            )
            self.accepted_employees_avg_overtime = (
                round(aggregates["total_overtime"] / total_days, 2)
                if total_days > 0
                else None
            )
            self.accepted_employees_avg_interviewer_rating = (
                round(aggregates.get("avg_interviewer_rating"), 2)
                if aggregates.get("avg_interviewer_rating") is not None
                else None
            )

            # Task-based correlations (require tasks > 0)
            task_based_qs = accepted.filter(
                interviewer_rating__isnull=False,
                number_of_accepted_tasks__gt=0,
            )
            print(f"→ Found Task-based eligible employees: {task_based_qs.count()}")

            task_df = pd.DataFrame(
                list(
                    task_based_qs.annotate(
                        task_rating=Cast("total_task_ratings", FloatField())
                        / Cast("number_of_accepted_tasks", FloatField()),
                        time_remaining=Cast(
                            "total_time_remaining_before_deadline", FloatField()
                        )
                        / Cast("number_of_accepted_tasks", FloatField()),
                    ).values("interviewer_rating", "task_rating", "time_remaining")
                )
            )

            self.interviewer_rating_to_task_rating_correlation = (
                round(task_df["interviewer_rating"].corr(task_df["task_rating"]), 4)
                if len(task_df) >= 2
                else None
            )
            self.interviewer_rating_to_time_remaining_correlation = (
                round(task_df["interviewer_rating"].corr(task_df["time_remaining"]), 4)
                if len(task_df) >= 2
                else None
            )

            # Day-based correlations (require non-holiday days > 0)
            day_based_qs = accepted.filter(
                interviewer_rating__isnull=False,
                number_of_non_holiday_days_since_join__gt=0,
            )
            print(f"→ Found Day-based eligible employees: {day_based_qs.count()}")

            day_df = pd.DataFrame(
                list(
                    day_based_qs.annotate(
                        lateness=Cast("total_lateness_hours", FloatField())
                        / Cast("number_of_non_holiday_days_since_join", FloatField()),
                        absence=Cast("total_absent_days", FloatField())
                        / Cast("number_of_non_holiday_days_since_join", FloatField()),
                        overtime=Cast("total_overtime_hours", FloatField())
                        / Cast("number_of_non_holiday_days_since_join", FloatField()),
                    ).values("interviewer_rating", "lateness", "absence", "overtime")
                )
            )

            self.interviewer_rating_to_lateness_hrs_correlation = (
                round(day_df["interviewer_rating"].corr(day_df["lateness"]), 4)
                if len(day_df) >= 2
                else None
            )
            self.interviewer_rating_to_absence_days_correlation = (
                round(day_df["interviewer_rating"].corr(day_df["absence"]), 4)
                if len(day_df) >= 2
                else None
            )
            self.interviewer_rating_to_avg_overtime_correlation = (
                round(day_df["interviewer_rating"].corr(day_df["overtime"]), 4)
                if len(day_df) >= 2
                else None
            )

        self.last_stats_calculation_time = timezone.now()
        self.save()


class Position(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class ApplicationLink(models.Model):
    url = models.URLField()
    distinction_name = models.CharField(max_length=100, unique=True)
    position = models.ForeignKey(Position, on_delete=models.CASCADE)
    is_coordinator = models.BooleanField()
    number_remaining_applicants_to_limit = models.IntegerField()
    skills = models.ManyToManyField("Skill")


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class EducationField(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class EducationDegree(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Region(models.Model):
    name = models.CharField(max_length=100, unique=True)
    distance_to_work = models.IntegerField()
    # Geolocation fields for attendance validation
    latitude = models.FloatField(
        null=True, blank=True, help_text="Building latitude for attendance validation"
    )
    longitude = models.FloatField(
        null=True, blank=True, help_text="Building longitude for attendance validation"
    )
    allowed_radius_meters = models.IntegerField(
        default=100, help_text="Allowed radius in meters for attendance check-in"
    )

    def __str__(self):
        return self.name


class Employee(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15)
    cv_url = models.CharField(max_length=1000, blank=True, null=True)
    position = models.ForeignKey(Position, on_delete=models.CASCADE)
    is_coordinator = models.BooleanField()
    application_link = models.ForeignKey(ApplicationLink, on_delete=models.CASCADE)

    region = models.ForeignKey("Region", on_delete=models.SET_NULL, null=True)
    highest_education_degree = models.ForeignKey(
        "EducationDegree", on_delete=models.SET_NULL, null=True
    )
    highest_education_field = models.ForeignKey(
        "EducationField", on_delete=models.SET_NULL, null=True
    )

    years_of_experience = models.IntegerField(null=True, blank=True)
    had_leadership_role = models.BooleanField(null=True, blank=True)
    percentage_of_matching_skills = models.FloatField(null=True, blank=True)
    has_position_related_high_education = models.BooleanField(null=True, blank=True)

    interview_datetime = models.DateTimeField(null=True, blank=True)
    interview_state = models.CharField(max_length=50, default="pending")
    interviewer = models.ForeignKey(HR, on_delete=models.SET_NULL, null=True)
    scheduling_interviewer = models.ForeignKey(
        HR, on_delete=models.SET_NULL, null=True, related_name="scheduled_employees"
    )
    interviewer_rating = models.FloatField(null=True, blank=True)
    interview_questions_avg_grade = models.FloatField(null=True, blank=True)
    join_date = models.DateField(null=True, blank=True)

    basic_salary = models.FloatField(null=True, blank=True)
    overtime_hour_salary = models.FloatField(null=True, blank=True)
    shorttime_hour_penalty = models.FloatField(null=True, blank=True)
    absence_penalty = models.FloatField(null=True, blank=True)

    expected_attend_time = models.TimeField(null=True, blank=True)
    expected_leave_time = models.TimeField(null=True, blank=True)

    total_overtime_hours = models.FloatField(
        default=0
    )  # summed to at approval (some other place in the code)
    total_lateness_hours = models.FloatField(
        default=0
    )  # summed to at check-in (some other place in the code)
    total_absent_days = models.IntegerField(
        default=0
    )  # summed to when found absent (some other place in the code)
    total_task_ratings = models.FloatField(
        default=0
    )  # summed to at accept (some other place in the code)
    total_time_remaining_before_deadline = models.FloatField(
        default=0
    )  # summed to at task accept (some other place in the code)

    number_of_non_holiday_days_since_join = models.IntegerField(
        default=0
    )  # summed to at marking absence .. if yesterday is about any case other than holiday, increment this (some other place in the code)
    number_of_accepted_tasks = models.IntegerField(
        default=0
    )  # summed to at task accept .. (some other place in the code)
    rank = models.IntegerField(null=True, blank=True)
    position_rank = models.IntegerField(null=True, blank=True)

    temp_cv = None

    def save(self, *args, **kwargs):
        if self.temp_cv:
            # ارفع الملف على supabase
            self.cv_url = upload_to_supabase(
                "employee-cvs", self.temp_cv, self.temp_cv.name
            )
        super().save(*args, **kwargs)

    @property
    def avg_task_ratings(self):
        if self.number_of_accepted_tasks == 0:
            return None
        return round(self.total_task_ratings / self.number_of_accepted_tasks, 2)

    @property
    def avg_time_remaining_before_deadline(self):
        if self.number_of_accepted_tasks == 0:
            return None
        return round(
            self.total_time_remaining_before_deadline / self.number_of_accepted_tasks, 2
        )

    @property
    def avg_overtime_hours(self):
        if self.number_of_non_holiday_days_since_join == 0:
            return None
        return round(
            self.total_overtime_hours / self.number_of_non_holiday_days_since_join, 2
        )

    @property
    def avg_lateness_hours(self):
        if self.number_of_non_holiday_days_since_join == 0:
            return None
        return round(
            self.total_lateness_hours / self.number_of_non_holiday_days_since_join, 2
        )

    @property
    def avg_absent_days(self):
        if self.number_of_non_holiday_days_since_join == 0:
            return None
        return round(
            self.total_absent_days / self.number_of_non_holiday_days_since_join, 2
        )

    skills = models.ManyToManyField(Skill, blank=True)

    predicted_avg_task_rating = models.FloatField(null=True, blank=True)
    predicted_avg_time_remaining_before_deadline = models.FloatField(
        null=True, blank=True
    )
    predicted_avg_lateness_hours = models.FloatField(null=True, blank=True)
    predicted_avg_absent_days = models.FloatField(null=True, blank=True)
    predicted_avg_overtime_hours = models.FloatField(null=True, blank=True)
    predicted_basic_salary = models.FloatField(null=True, blank=True)
    last_prediction_date = models.DateTimeField(null=True, blank=True)


class InterviewQuestion(models.Model):
    text = models.TextField()
    grade = models.FloatField()
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)


class Task(models.Model):
    deadline = models.DateTimeField()
    created_by = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="created_tasks"
    )
    assigned_to = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="assigned_tasks"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_submitted = models.BooleanField(default=False)
    submission_time = models.DateTimeField(null=True, blank=True)
    is_refused = models.BooleanField(default=False)
    is_accepted = models.BooleanField(default=False)
    rating = models.FloatField(null=True, blank=True)
    refuse_reason = models.TextField(blank=True)
    time_remaining_before_deadline_when_accepted = models.FloatField(
        null=True, blank=True
    )


class File(models.Model):
    file_url = models.CharField(max_length=1000)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    temp_file = None

    def save(self, *args, **kwargs):
        if self.temp_file:
            url = upload_to_supabase("task-files", self.temp_file, self.temp_file.name)
            self.file_url = url
        super().save(*args, **kwargs)


WEEKDAYS = [
    ("Monday", "Monday"),
    ("Tuesday", "Tuesday"),
    ("Wednesday", "Wednesday"),
    ("Thursday", "Thursday"),
    ("Friday", "Friday"),
    ("Saturday", "Saturday"),
    ("Sunday", "Sunday"),
]


class HolidayYearday(models.Model):
    month = models.IntegerField()
    day = models.IntegerField()
    employees = models.ManyToManyField(Employee)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["month", "day"], name="unique_holiday_month_day"
            )
        ]
        verbose_name = "Yearly Holiday"
        verbose_name_plural = "Yearly Holidays"


class HolidayWeekday(models.Model):
    weekday = models.CharField(max_length=10, choices=WEEKDAYS, unique=True)
    employees = models.ManyToManyField(Employee)

    class Meta:
        verbose_name = "Weekly Holiday"
        verbose_name_plural = "Weekly Holidays"


class OnlineDayYearday(models.Model):
    month = models.IntegerField()
    day = models.IntegerField()
    employees = models.ManyToManyField(Employee)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["month", "day"], name="unique_online_month_day"
            )
        ]
        verbose_name = "Yearly Online Day"
        verbose_name_plural = "Yearly Online Days"


class OnlineDayWeekday(models.Model):
    weekday = models.CharField(max_length=10, choices=WEEKDAYS, unique=True)
    employees = models.ManyToManyField(Employee)

    class Meta:
        verbose_name = "Weekly Online Day"
        verbose_name_plural = "Weekly Online Days"


class CompanyStatistics(models.Model):
    generated_at = models.DateTimeField(auto_now_add=True)
    snapshot_date = models.DateField(auto_now_add=True)

    # Overall company stats
    total_employees = models.IntegerField()
    total_hrs = models.IntegerField()

    # Position-specific stats (stored as JSON)
    position_stats = models.JSONField(default=dict)

    # Distance stats
    region_stats = models.JSONField(default=dict)
    # Monthly salary totals (stored as JSON)
    monthly_salary_totals = models.JSONField(default=list)

    # Overall averages
    overall_avg_task_rating = models.FloatField(null=True)
    overall_avg_time_remaining = models.FloatField(null=True)
    overall_avg_overtime = models.FloatField(null=True)
    overall_avg_lateness = models.FloatField(null=True)
    overall_avg_absent_days = models.FloatField(null=True)
    overall_avg_salary = models.FloatField(null=True)

    def __str__(self):
        return f"Company Stats - {self.snapshot_date}"


class EmployeeLeavePolicy(models.Model):
    employee = models.OneToOneField(
        Employee, on_delete=models.CASCADE, related_name="leave_policy"
    )
    yearly_quota = models.IntegerField(default=21)
    max_days_per_request = models.IntegerField(default=5)

    def __str__(self):
        return f"Leave Policy for {self.employee.user.username}"


class CasualLeave(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="casual_leaves"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    duration = models.PositiveIntegerField(editable=False)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_casual_leaves",
    )
    rejection_reason = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        # Auto-calculate duration when saving
        if self.start_date and self.end_date:
            self.duration = (self.end_date - self.start_date).days + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.duration}-day leave for {self.employee.user.username} ({self.status})"

    class Meta:
        ordering = ["-created_at"]


class Headquarters(models.Model):
    """
    Single headquarters location configuration for attendance validation.
    """

    name = models.CharField(max_length=100, default="Cairo Headquarters")
    latitude = models.FloatField(default=30.0500)
    longitude = models.FloatField(default=31.2333)
    allowed_radius_meters = models.IntegerField(default=150)

    def __str__(self):
        return f"{self.name} ({self.latitude}, {self.longitude})"

    def save(self, *args, **kwargs):
        # Ensure only one Headquarters instance exists
        if not self.pk and Headquarters.objects.exists():
            raise ValueError("Only one Headquarters instance is allowed.")
        super().save(*args, **kwargs)

    @classmethod
    def get_headquarters(cls):
        """Get the headquarters instance, create default if none exists."""
        headquarters, created = cls.objects.get_or_create(
            defaults={
                "name": "Cairo Headquarters",
                "latitude": 30.0500,
                "longitude": 31.2333,
                "allowed_radius_meters": 150,
            }
        )
        return headquarters
