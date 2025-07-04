from django.db import models
from django.contrib.auth.models import User


class BasicInfo(models.Model):
    profile_image = models.ImageField(upload_to='profile_images/',default='profile_images/default.jpg')
    phone = models.CharField(max_length=15, blank=True,null=True)
    role = models.CharField(max_length=20)
    username = models.CharField(max_length=150, blank=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE)



class HR(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    accepted_employees_avg_task_rating = models.FloatField(null=True, blank=True)
    accepted_employees_avg_time_remaining = models.FloatField(null=True, blank=True)
    accepted_employees_avg_lateness_hrs = models.FloatField(null=True, blank=True)
    accepted_employees_avg_absence_days = models.FloatField(null=True, blank=True)


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
    skills = models.ManyToManyField('Skill')


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

    def __str__(self):
        return self.name  

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15)
    cv = models.FileField(upload_to='cvs/', default='cvs/default.pdf')
    position = models.ForeignKey(Position, on_delete=models.CASCADE)
    is_coordinator = models.BooleanField()
    application_link = models.ForeignKey(ApplicationLink, on_delete=models.CASCADE)

    region = models.ForeignKey('Region', on_delete=models.SET_NULL, null=True)
    highest_education_degree = models.ForeignKey('EducationDegree', on_delete=models.SET_NULL, null=True)
    highest_education_field = models.ForeignKey('EducationField', on_delete=models.SET_NULL, null=True)

    years_of_experience = models.IntegerField(null=True, blank=True)
    had_leadership_role = models.BooleanField(null=True, blank=True)
    percentage_of_matching_skills = models.FloatField(null=True, blank=True)
    has_position_related_high_education = models.BooleanField(null=True, blank=True)


    predicted_avg_task_rating = models.FloatField(null=True, blank=True)
    predicted_avg_time_remaining_before_deadline = models.FloatField(null=True, blank=True)
    predicted_avg_attendance_lateness_hrs = models.FloatField(null=True, blank=True)
    predicted_avg_absence_days = models.FloatField(null=True, blank=True)

    interview_datetime = models.DateTimeField(null=True, blank=True)
    interview_state = models.CharField(max_length=50, default='pending')
    interviewer = models.ForeignKey(HR, on_delete=models.SET_NULL, null=True)
    scheduling_interviewer = models.ForeignKey(HR, on_delete=models.SET_NULL, null=True,related_name="scheduled_employees")
    interviewer_rating = models.FloatField(null=True, blank=True)
    interview_questions_avg_grade = models.FloatField(null=True, blank=True)
    join_date = models.DateField(null=True, blank=True)
    basic_salary = models.FloatField(null=True, blank=True)
    overtime_hour_salary = models.FloatField(null=True, blank=True)
    shorttime_hour_penalty = models.FloatField(null=True, blank=True)
    absence_penalty = models.FloatField(null=True, blank=True)
    expected_attend_time = models.TimeField(null=True, blank=True)
    expected_leave_time = models.TimeField(null=True, blank=True)
    overtime_hours = models.FloatField(default=0)
    lateness_hours = models.FloatField(default=0)
    short_time_hours = models.FloatField(default=0)
    number_of_absent_days = models.IntegerField(default=0)
    last_attend_date = models.DateField(null=True, blank=True)
    last_leave_date = models.DateField(null=True, blank=True)
    avg_task_rating = models.FloatField(null=True, blank=True)
    avg_time_remaining_before_deadline = models.FloatField(null=True, blank=True)
    avg_attendance_lateness_hrs = models.FloatField(null=True, blank=True)
    avg_absence_days = models.FloatField(null=True, blank=True)
    skills = models.ManyToManyField(Skill, blank=True)


class InterviewQuestion(models.Model):
    text = models.TextField()
    grade = models.FloatField()
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)


class OvertimeClaim(models.Model):
    hours = models.FloatField()
    leave_date = models.DateField()
    is_at_midnight = models.BooleanField(default=False)
    claimer = models.ForeignKey(Employee, on_delete=models.CASCADE)


class Task(models.Model):
    deadline = models.DateTimeField()
    created_by = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='created_tasks')
    assigned_to = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assigned_tasks')
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_submitted = models.BooleanField(default=False)
    submission_time = models.DateTimeField(null=True, blank=True)
    is_refused = models.BooleanField(default=False)
    is_accepted = models.BooleanField(default=False)
    rating = models.FloatField(null=True, blank=True)
    refuse_reason = models.TextField(blank=True)
    time_remaining_before_deadline_when_accepted = models.FloatField(null=True, blank=True)


class File(models.Model):
    file = models.FileField(upload_to='task_files/')
    task = models.ForeignKey(Task, on_delete=models.CASCADE)


class Report(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    basic_salary = models.FloatField()
    overtime_hour_salary = models.FloatField()
    shorttime_hour_penalty = models.FloatField()
    absence_penalty = models.FloatField()
    expected_attend_time = models.TimeField()
    expected_leave_time = models.TimeField()
    overtime_hours = models.FloatField()
    short_time_hours = models.FloatField()
    number_of_absent_days = models.IntegerField()
    total_overtime_penalty = models.FloatField()
    total_shortness_penalty = models.FloatField()
    total_absence_penalty = models.FloatField()
    total = models.FloatField()
    month = models.CharField(max_length=20)


class HoliOrOnlineDayYearday(models.Model):
    month = models.IntegerField()
    day = models.IntegerField()
    employees = models.ManyToManyField(Employee)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['month', 'day'], name='unique_month_day')
        ]


WEEKDAYS = [
    ("Monday", "Monday"),
    ("Tuesday", "Tuesday"),
    ("Wednesday", "Wednesday"),
    ("Thursday", "Thursday"),
    ("Friday", "Friday"),
    ("Saturday", "Saturday"),
    ("Sunday", "Sunday"),
]

class HoliOrOnlineDayWeekday(models.Model):
    weekday = models.CharField(max_length=10, choices=WEEKDAYS,unique=True)
    employees = models.ManyToManyField(Employee)

