# from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Avg,Sum,FloatField,Count,Q
from django.db.models.functions import Cast
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateformat import format as django_format
from django.utils.timezone import localtime, make_aware, is_naive
from django.utils.dateparse import parse_datetime
import joblib
import os
import numpy as np
from rest_framework.viewsets import ModelViewSet, ViewSet, ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from rest_framework.pagination import PageNumberPagination

User = get_user_model()

from .models import (
    BasicInfo,
    HR,
    Employee,
    ApplicationLink,
    Skill,
    EducationDegree,
    Region,
    EducationField,
    InterviewQuestion,
    Task,
    File,
    Position,CompanyStatistics,SalaryRecord
)

from .serializers import (
    UserSerializer,
    BasicInfoSerializer,
    HRSerializer,
    EmployeeSerializer,
    EmployeeListSerializer,
    EmployeeRejectingSerializer,
    EmployeeAcceptingSerializer,
    ApplicationLinkSerializer,
    SkillSerializer,
    CompanyStatisticsSerializer,
    TaskSerializer,
    HRListSerializer,EmployeeCVUpdateSerializer,
    PositionSerializer,
    EducationFieldSerializer,RegionSerializer,EducationDegreeSerializer
)

from .permissions import IsHR, IsAdmin, IsHRorAdmin, IsEmployee, IsCoordinator

from .cv_processing.LLM_utils import TogetherCVProcessor
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
import random
import string


def recalculate_interview_avg_grade(employee):
    avg = InterviewQuestion.objects.filter(employee=employee).aggregate(Avg("grade"))[
        "grade__avg"
    ]
    employee.interview_questions_avg_grade = avg
    employee.save(update_fields=["interview_questions_avg_grade"])

def calculate_statistics():
    employees = Employee.objects.filter(interview_state='accepted')
    total_employees = employees.count()
    total_hrs = HR.objects.count()

    positions = Position.objects.all()
    position_stats = {}

    for position in positions:
        pos_employees = employees.filter(position=position)
        pos_count = pos_employees.count()
        if pos_count == 0:
            continue

        total_task_ratings = pos_employees.aggregate(sum=Sum('total_task_ratings'))['sum'] or 0
        total_accepted_tasks = pos_employees.aggregate(sum=Sum('number_of_accepted_tasks'))['sum'] or 0
        total_time_remaining = pos_employees.aggregate(sum=Sum('total_time_remaining_before_deadline'))['sum'] or 0
        total_overtime = pos_employees.aggregate(sum=Sum('total_overtime_hours'))['sum'] or 0
        total_lateness = pos_employees.aggregate(sum=Sum('total_lateness_hours'))['sum'] or 0
        total_absent = pos_employees.aggregate(sum=Sum('total_absent_days'))['sum'] or 0
        total_non_holiday_days = pos_employees.aggregate(sum=Sum('number_of_non_holiday_days_since_join'))['sum'] or 0
        avg_salary = pos_employees.aggregate(avg=Avg('basic_salary'))['avg']

        position_stats[position.name] = {
            'count': pos_count,
            'avg_task_rating': round(total_task_ratings / total_accepted_tasks, 2) if total_accepted_tasks > 0 else None,
            'avg_time_remaining': round(total_time_remaining / total_accepted_tasks, 2) if total_accepted_tasks > 0 else None,
            'avg_overtime': round(total_overtime / total_non_holiday_days, 2) if total_non_holiday_days > 0 else None,
            'avg_lateness': round(total_lateness / total_non_holiday_days, 2) if total_non_holiday_days > 0 else None,
            'avg_absent_days': round(total_absent / total_non_holiday_days, 2) if total_non_holiday_days > 0 else None,
            'avg_salary': avg_salary,
        }

    total_task_ratings = employees.aggregate(sum=Sum('total_task_ratings'))['sum'] or 0
    total_accepted_tasks = employees.aggregate(sum=Sum('number_of_accepted_tasks'))['sum'] or 0
    total_time_remaining = employees.aggregate(sum=Sum('total_time_remaining_before_deadline'))['sum'] or 0
    total_overtime = employees.aggregate(sum=Sum('total_overtime_hours'))['sum'] or 0
    total_lateness = employees.aggregate(sum=Sum('total_lateness_hours'))['sum'] or 0
    total_absent = employees.aggregate(sum=Sum('total_absent_days'))['sum'] or 0
    total_non_holiday_days = employees.aggregate(sum=Sum('number_of_non_holiday_days_since_join'))['sum'] or 0
    avg_salary = employees.aggregate(avg=Avg('basic_salary'))['avg']

    overall_stats = {
        'overall_avg_task_rating': round(total_task_ratings / total_accepted_tasks, 2) if total_accepted_tasks > 0 else None,
        'overall_avg_time_remaining': round(total_time_remaining / total_accepted_tasks, 2) if total_accepted_tasks > 0 else None,
        'overall_avg_overtime': round(total_overtime / total_non_holiday_days, 2) if total_non_holiday_days > 0 else None,
        'overall_avg_lateness': round(total_lateness / total_non_holiday_days, 2) if total_non_holiday_days > 0 else None,
        'overall_avg_absent_days': round(total_absent / total_non_holiday_days, 2) if total_non_holiday_days > 0 else None,
        'overall_avg_salary': avg_salary,
    }

    salary_records = SalaryRecord.objects.all()
    monthly_totals = {}
    for record in salary_records:
        key = f"{record.year}-{record.month}"
        monthly_totals[key] = monthly_totals.get(key, 0) + record.final_salary

    monthly_salary_data = [{
        'year': int(k.split('-')[0]),
        'month': int(k.split('-')[1]),
        'total_paid': v
    } for k, v in monthly_totals.items()]

    return {
        'total_employees': total_employees,
        'total_hrs': total_hrs,
        'position_stats': position_stats,
        'monthly_salary_totals': monthly_salary_data,
        **overall_stats
    }
class EightPerPagePagination(PageNumberPagination):
    page_size = 8
    max_page_size = 100


class AdminViewEmployeesViewSet(ReadOnlyModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = EightPerPagePagination 
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = [
        "region",
        "position",
        "is_coordinator",
        "interview_state",
        "application_link",
    ]
    search_fields = ["user__username", "phone"]

    def get_queryset(self):
        base_queryset = super().get_queryset()
        
        # Optimize differently for list vs detail views
        if self.action == 'list':
            queryset = base_queryset.select_related(
                'user', 
                'position', 
                'region',
                'user__basicinfo'
            )
        else:
            # Detail view needs more prefetches
            queryset = base_queryset.select_related(
                'user',
                'position',
                'region',
                'user__basicinfo',
                'highest_education_degree',  'application_link'
            ).prefetch_related(
                'skills'                  ,    'holidayyearday_set',
    'holidayweekday_set',
    'onlinedayyearday_set',
    'onlinedayweekday_set'
            )
        
        interview_state_not = self.request.query_params.get('interview_state_not')
        if interview_state_not:
            queryset = queryset.exclude(interview_state=interview_state_not)
        
        return queryset

    def retrieve(self, request, *args, **kwargs):
        self.serializer_class = EmployeeSerializer
        return super().retrieve(request, *args, **kwargs)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        elif self.action == 'update_cv_data':
            return EmployeeCVUpdateSerializer
        return EmployeeSerializer
    

    @action(detail=True, methods=['patch'], url_path='update-cv-data')
    def update_cv_data(self, request, pk=None):

        employee = self.get_object()
        serializer = self.get_serializer(employee, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Handle skills separately
        skills = request.data.get('skills')
        if skills is not None:
            employee.skills.set(skills)
        
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminManageSkillsViewSet(ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "post"]


class AdminManagePositionsViewSet(ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "post"]

class AdminInviteHRViewSet(ModelViewSet):
    """
    Allows admin to invite new HRs by email
    - Creates HR account with email
    - Generates random password based on timestamp
    - Sends email with credentials
    - Only accessible by admin role
    """

    queryset = User.objects.none()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def create(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=email).exists():
            return Response(
                {"error": "User with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        password = "".join(random.choices(string.ascii_letters + string.digits, k=12))
        user = User.objects.create_user(username=email, password=password)

        HR.objects.create(
            user=user,
            accepted_employees_avg_task_rating=None,
            accepted_employees_avg_time_remaining=None,
            accepted_employees_avg_lateness_hrs=None,
            accepted_employees_avg_absence_days=None,
        )

        BasicInfo.objects.create(user=user, role="hr", username=email.split("@")[0])

        send_mail(
            subject="Invitation to join HR Portal",
            message=f"Your account has been created.\nUsername: {email}\nPassword: {password}",
            from_email="tempohr44@gmail.com",
            recipient_list=[email],
            fail_silently=False,
        )

        return Response(
            {"message": "Invitation sent successfully."}, status=status.HTTP_201_CREATED
        )


class AdminViewHRsViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = EightPerPagePagination 
    filter_backends = [SearchFilter]
    search_fields = ["user__username", "user__email"]

    def get_queryset(self):
        queryset = HR.objects.select_related(
            'user', 
            'user__basicinfo'  
        )
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return HRListSerializer
        return HRSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)



class AdminPromoteEmployeeViewSet(ModelViewSet):
    """
    Promotes employee from task submitter to task receiver
    - Toggles is_coordinator flag
    - Only accessible by admin role
    """

    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]


class AdminViewApplicationLinksViewSet(ReadOnlyModelViewSet):
    """
    Allows admin to view application links
    - Read-only: no creation, update, or deletion
    - Only accessible by Admin role
    """

    queryset = ApplicationLink.objects.all()
    serializer_class = ApplicationLinkSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['position', 'is_coordinator']
    search_fields = ['distinction_name']


class HRManageApplicationLinksViewSet(ModelViewSet):
    """
    Allows HR to generate application links
    - Creates unique link with position, skills, role, max applicants
    - Only accessible by HR role
    """

    queryset = ApplicationLink.objects.all()
    serializer_class = ApplicationLinkSerializer
    permission_classes = [IsAuthenticated, IsHR]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['position', 'is_coordinator']
    search_fields = ['distinction_name']

    # in frontend, the URL will be constructed based on "distinction_name"
    # ex. if "junior-frontend-2025", then: "http://localhost:3000/apply/junior-frontend-2025/" → shown in a non-editable field

    # skills and position will be passed as FKs (fetched from DB — name shown in a list, value submitted as the FK)
    # new skill/position? there is an api to create one (button side by side to the dd list in front)


class PublicApplicantsViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    http_method_names = ["post"]

    def create(self, request, *args, **kwargs):
        data = request.data

        email = data.get("email")
        phone = data.get("phone")
        cv = data.get("cv")
        distinction_name = data.get("distinction_name")

        if not all([email, phone, cv, distinction_name]):
            return Response({"detail": "Missing required fields."}, status=400)

        # 1. Get ApplicationLink
        try:
            application_link = ApplicationLink.objects.get(
                distinction_name=distinction_name
            )
            is_coordinator = application_link.is_coordinator

        except ApplicationLink.DoesNotExist:
            return Response({"detail": "Invalid distinction name."}, status=400)

        if User.objects.filter(username=email).exists():
            return Response({"detail": "User already exists."}, status=400)

        if application_link.number_remaining_applicants_to_limit <= 0:
            return Response({"detail": "Limit of applicants exceeded"}, status=400)

        # 2. Extract info from CV
        all_skills = list(Skill.objects.values_list("name", flat=True))
        degree_choices = list(EducationDegree.objects.values_list("name", flat=True))
        region_choices = list(Region.objects.values_list("name", flat=True))
        field_choices = list(EducationField.objects.values_list("name", flat=True))

        processor = TogetherCVProcessor()

        llm_success = False
        cv_info = {}

        try:
            cv_info = processor.extract_info(
                cv_file=cv,
                choices={
                    "skills": all_skills,
                    "degrees": degree_choices,
                    "regions": region_choices,
                    "fields": field_choices,
                },
                position=application_link.position,
            )
            print("✅✅ final used:", cv_info)
            llm_success = True
        except ValueError as e:
            print(f"⚠️ CV processing failed: {e}")

        # Initialize all optional fields
        region = None
        degree = None
        field = None
        experience = None
        had_leadership = None
        skills_list = []
        percentage = None
        has_relevant_edu = None
        distance = None

        # 3. Extract fields only if present
        if "skills" in cv_info:
            emp_skill_names = cv_info["skills"]
            skills_list = Skill.objects.filter(name__in=emp_skill_names)
            required_skills = application_link.skills.all()
            relevant_emp_skills = skills_list.filter(id__in=required_skills)
            percentage = (
                (relevant_emp_skills.count() / required_skills.count()) * 100
                if required_skills.exists()
                else 0
            )

        if "region" in cv_info:
            region_name = cv_info["region"]
            region = Region.objects.get(name=region_name)

        if "degree" in cv_info:
            degree = EducationDegree.objects.get(name=cv_info["degree"])

        if "field" in cv_info:
            field = EducationField.objects.get(name=cv_info["field"])

        experience = cv_info.get("experience")
        had_leadership = cv_info.get("had_leadership")
        has_relevant_edu = cv_info.get("has_position_related_high_education")

        # 4. Create User & Employee
        with transaction.atomic():
            user = User.objects.create(username=email)
            user.set_unusable_password()
            user.save()

            employee_data = {
                "user": user,
                "cv": cv,
                "position": application_link.position,
                "is_coordinator": is_coordinator,
                "application_link": application_link,
            }

            # Optional fields
            if region:
                employee_data["region"] = region
            if degree:
                employee_data["highest_education_degree"] = degree
            if field:
                employee_data["highest_education_field"] = field
            if experience is not None:
                employee_data["years_of_experience"] = experience
            if had_leadership is not None:
                employee_data["had_leadership_role"] = had_leadership
            if percentage is not None:
                employee_data["percentage_of_matching_skills"] = percentage
            if has_relevant_edu is not None:
                employee_data["has_position_related_high_education"] = has_relevant_edu

            employee = Employee.objects.create(**employee_data)

            if skills_list:
                employee.skills.set(skills_list)

            BasicInfo.objects.create(
                user=user, role="employee", username=email.split("@")[0] , 
                phone=phone,
            )

            application_link.number_remaining_applicants_to_limit -= 1
            application_link.save()

        message = "Application submitted successfully."
        if not llm_success:
            message += " (Note: CV parsing failed, submitted with required data only.)"

        return Response(
            {"detail": message, "llm_success": llm_success, "employee_id": employee.id},
            status=status.HTTP_201_CREATED,
        )


class HRManageSkillsViewSet(ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated, IsHR]


class HRManagePositionsViewSet(ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [IsAuthenticated, IsHR]


class HRViewEmployeesViewSet(ModelViewSet):
    """
    Displays employee records (hides other HRs)
    - Only accessible by HR role
    - Includes filters and search functionality
    - Optimized with prefetch_related and select_related to prevent N+1 queries
    """
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsHR]
    pagination_class = EightPerPagePagination 
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = [
        "region",
        "position",
        "is_coordinator",
        "interview_state",
        "application_link",
    ]
    search_fields = ["user__username", "phone"]

    def get_queryset(self):
        queryset = Employee.objects.select_related(
            'user',
            'user__basicinfo',
            'region',
            'position',
            'highest_education_field', 
            'application_link'
        ).prefetch_related(
            'skills',
            'holidayyearday_set',
            'holidayweekday_set',
            'onlinedayyearday_set',
            'onlinedayweekday_set'
        )
        
        interview_state_not = self.request.query_params.get('interview_state_not')
        if interview_state_not:
            queryset = queryset.exclude(interview_state=interview_state_not)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        elif self.action == 'update_cv_data':
            return EmployeeCVUpdateSerializer
        return EmployeeSerializer

    @action(detail=True, methods=['patch'], url_path='update-cv-data')
    def update_cv_data(self, request, pk=None):
        """
        Special endpoint for HR to update employee CV-related data
        PATCH /hr/employees/<pk>/update-cv-data/
        """
        employee = self.get_object()
        serializer = self.get_serializer(employee, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Handle skills separately
        skills = request.data.get('skills')
        if skills is not None:
            employee.skills.set(skills)
        
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="update-profile-fields")
    def update_profile_fields(self, request, pk=None):

        employee = get_object_or_404(Employee, pk=pk)

        required_fields = [
            "region",
            "highest_education_degree",
            "highest_education_field",
            "years_of_experience",
            "had_leadership_role",
            "has_position_related_high_education",
            "skills",
        ]

        missing = [f for f in required_fields if f not in request.data]
        if missing:
            return Response(
                {"detail": f"Missing required fields: {', '.join(missing)}"}, status=400
            )

        try:
            region = Region.objects.get(id=request.data["region"])
            degree = EducationDegree.objects.get(
                id=request.data["highest_education_degree"]
            )
            field = EducationField.objects.get(
                id=request.data["highest_education_field"]
            )
            skills = Skill.objects.filter(id__in=request.data["skills"])

            if skills.count() != len(request.data["skills"]):
                return Response(
                    {"detail": "One or more skill IDs are invalid."}, status=400
                )

            employee.region = region
            employee.highest_education_degree = degree
            employee.highest_education_field = field
            employee.years_of_experience = int(request.data["years_of_experience"])
            employee.had_leadership_role = bool(request.data["had_leadership_role"])
            employee.has_position_related_high_education = bool(
                request.data["has_position_related_high_education"]
            )
            employee.skills.set(skills)
            required_skills = employee.application_link.skills.all()
            relevant_emp_skills = skills.intersection(required_skills)
            percentage = (
                (relevant_emp_skills.count() / required_skills.count()) * 100
                if required_skills.exists()
                else 0
            )
            employee.percentage_of_matching_skills = percentage

            employee.save()
            return Response({"detail": "Employee profile fields updated successfully."})

        except Exception as e:
            return Response({"detail": str(e)}, status=400)

    @action(detail=False, methods=["get"], url_path="my-scheduled")
    def my_scheduled_employees(self, request):
        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can view this."}, status=403)

        queryset = Employee.objects.filter(scheduling_interviewer=hr)
        serializer = EmployeeListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my-taken")
    def my_taken_employees(self, request):
        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can view this."}, status=403)

        queryset = Employee.objects.filter(interviewer=hr)
        serializer = EmployeeListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="my-interview-questions")
    def my_interview_questions(self, request, pk=None):
        """
        Fetches all interview questions for this employee,
        but only if the current HR is the assigned interviewer.
        """
        employee = self.get_object()

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can access this."}, status=403)

        if employee.interviewer != hr:
            return Response(
                {"detail": "You are not the assigned interviewer for this employee."},
                status=403,
            )

        questions = InterviewQuestion.objects.filter(employee=employee)
        data = [{"id": q.id, "text": q.text, "grade": q.grade} for q in questions]
        return Response(data)

    @action(detail=True, methods=["patch"], url_path="schedule-interview")
    def schedule_interview(self, request, pk=None):
        employee = self.get_object()

        try:
            hr = HR.objects.get(user=request.user)
            hr_name = hr.user.basicinfo.username
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can schedule interviews."}, status=403)

        if employee.scheduling_interviewer and employee.scheduling_interviewer != hr:
            return Response(
                {
                    "detail": f"Interview already scheduled by {employee.scheduling_interviewer.user.basicinfo.username}, contact him for any scheduling updates"
                },
                status=400,
            )

        interview_datetime_str = request.data.get("interview_datetime")
        if not interview_datetime_str:
            return Response({"detail": "Missing interview_datetime."}, status=400)

        interview_datetime = parse_datetime(interview_datetime_str)
        if not interview_datetime:
            return Response(
                {
                    "detail": "Invalid datetime format. Use ISO format like 2025-07-01T14:00:00"
                },
                status=400,
            )

        if is_naive(interview_datetime):
            interview_datetime = make_aware(interview_datetime)

        employee.interview_datetime = interview_datetime
        employee.interview_state = "scheduled"
        employee.scheduling_interviewer = hr
        employee.save()

        # Format for email
        formatted_dt = django_format(
            localtime(interview_datetime), "l, F j, Y \\a\\t h:i A"
        )

        send_mail(
            subject="Interview Scheduled",
            message=f"Your interview has been scheduled for {formatted_dt} by HR: {hr_name} .\n\nPlease be on time.\n\nBest regards,\nHR Team",
            from_email="tempohr44@gmail.com",
            recipient_list=[employee.user.username],
            fail_silently=False,
        )

        return Response({"detail": "Interview scheduled and email sent successfully."})

    @action(detail=True, methods=["patch"], url_path="take-interviewee")
    def start_interview_now(self, request, pk=None):
        # this is just interviewer field setting, it can happen by whoever hr, whenever possible
        # there should be a button directing to a react page with the emp id, so it is fetched and manipulated there
        # in that page there should be a button to [take interviewee], it doesnt check time. it just checks the user (hr)

        employee = self.get_object()

        if employee.interviewer is not None:
            return Response(
                {"detail": "This interviewee has already been taken"}, status=400
            )

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Current user is not an HR."}, status=403)

        employee.interviewer = hr
        employee.save()

        return Response({"detail": "Interviewee taken successfully."})

    @action(detail=True, methods=["post"], url_path="add-question")
    def add_interview_question(self, request, pk=None):
        """
        Adds an interview question and its grade.
        Only the HR assigned as the interviewer can perform this.
        """
        employee = self.get_object()

        if employee.interview_state == "done" or employee.interview_state == "accepted":
            return Response(
                {"detail": "Interview is already completed. You cannot modify it."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response(
                {"detail": "Only HRs can add interview questions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if employee.interviewer != hr:
            return Response(
                {"detail": "You are not the interviewer assigned to this employee."},
                status=status.HTTP_403_FORBIDDEN,
            )

        text = request.data.get("text")
        grade = 0

        if not text:
            return Response(
                {"detail": "Missing text"}, status=status.HTTP_400_BAD_REQUEST
            )

        InterviewQuestion.objects.create(text=text, grade=grade, employee=employee)

        recalculate_interview_avg_grade(employee)

        return Response(
            {"detail": "Interview question added successfully."},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="delete-question")
    def delete_interview_question(self, request, pk=None):
        """
        Deletes an interview question by ID.
        Only the HR assigned as the interviewer can perform this.
        """
        employee = self.get_object()

        if employee.interview_state == "done" or employee.interview_state == "accepted":
            return Response(
                {"detail": "Interview is already completed. You cannot modify it."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response(
                {"detail": "Only HRs can delete interview questions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if employee.interviewer != hr:
            return Response(
                {"detail": "You are not the interviewer assigned to this employee."},
                status=status.HTTP_403_FORBIDDEN,
            )

        question_id = request.data.get("question_id")
        if not question_id:
            return Response(
                {"detail": "Missing question_id"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            question = InterviewQuestion.objects.get(id=question_id, employee=employee)
        except InterviewQuestion.DoesNotExist:
            return Response(
                {"detail": "Interview question not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        question.delete()

        recalculate_interview_avg_grade(employee)

        return Response(
            {"detail": "Interview question deleted successfully."},
            status=status.HTTP_200_OK,
        )


    @action(detail=True, methods=["patch"], url_path="update-question-grade")
    def update_question_grade(self, request, pk=None):
        """
        In front, questions for the emp in that page are fetched with him/her and rendered,
        there should be an option for each question to update its grade (knowing the id).

        Update the grade of a specific interview question.
        Only the HR assigned to this employee can perform this.
        """
        employee = self.get_object()

        if employee.interview_state == "done" or employee.interview_state == "accepted":
            return Response(
                {"detail": "Interview is already completed. You cannot modify it."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response(
                {"detail": "Only HRs can perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if employee.interviewer != hr:
            return Response(
                {"detail": "You are not the assigned interviewer."},
                status=status.HTTP_403_FORBIDDEN,
            )

        question_id = request.data.get("question_id")
        grade = request.data.get("grade")

        if not (0 <= grade <= 100):
            return Response(
                {"detail": "Grade must be between 0 and 100."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if question_id is None or grade is None:
            return Response(
                {"detail": "Missing 'question_id' or 'grade'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question = InterviewQuestion.objects.get(id=question_id, employee=employee)
        except InterviewQuestion.DoesNotExist:
            return Response(
                {"detail": "Question not found for this employee."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            grade = float(grade)
        except ValueError:
            return Response(
                {"detail": "Grade must be a number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        question.grade = grade
        question.save()
        recalculate_interview_avg_grade(employee)

        return Response({"detail": "Question grade updated successfully."})

    @action(detail=True, methods=["patch"], url_path="rate-interviewee")
    def rate_interviewee(self, request, pk=None):
        """
        Allows the assigned HR interviewer to rate the interviewee.
        """
        employee = self.get_object()

        if employee.interview_state == "done" or employee.interview_state == "accepted":
            return Response(
                {"detail": "Interview is already completed. You cannot modify it."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response(
                {"detail": "Only HRs can rate interviewees."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if employee.interviewer != hr:
            return Response(
                {"detail": "You are not the assigned interviewer for this employee."},
                status=status.HTTP_403_FORBIDDEN,
            )

        rating = request.data.get("rating")

        if rating is None:
            return Response(
                {"detail": "Missing 'rating' value."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            rating = float(rating)
        except ValueError:
            return Response(
                {"detail": "Rating must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (0 <= rating <= 100):
            return Response(
                {"detail": "Rating must be between 0 and 100."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        employee.interviewer_rating = rating
        employee.save(update_fields=["interviewer_rating"])

        return Response(
            {"detail": "Interviewee rated successfully."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"], url_path="submit-interview")
    def submit_interview(self, request, pk=None):
        """
        Marks the interview as 'done'. Only the assigned HR can do this.
        The only highlighted button in the page
        """
        employee = self.get_object()

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response(
                {"detail": "Only HRs can perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if employee.interviewer != hr:
            return Response(
                {"detail": "You are not the assigned interviewer."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if employee.interview_state == "done" or employee.interview_state == "accepted":
            return Response(
                {"detail": "Interview is already submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        employee.interview_state = "done"
        employee.save(update_fields=["interview_state"])

        return Response({"detail": "Interview submitted successfully."})




class EmployeeCheckInOutViewSet(ModelViewSet):
    """
    Handles check-in/check-out functionality
    - Check-in button appears under specific conditions
    - Check-out button appears under specific conditions
    - Records lateness/early leave/overtime
    - Only accessible by employee role
    """

    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]


class SystemAutomationViewSet(ModelViewSet):
    """
    Handles system automation tasks
    - Daily 00:00 checks for absences and incomplete check-outs
    - Monthly 1st report generation and counter resets
    - System lock/unlock functionality
    - Should be triggered by cron jobs
    """

    queryset = User.objects.none()  # Not model-based
    serializer_class = None


class HRAcceptEmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeAcceptingSerializer
    permission_classes = [IsAuthenticated, IsHR]
    http_method_names = ["patch"]

    def partial_update(self, request, *args, **kwargs):
        employee = self.get_object()

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response(
                {"detail": "Only HRs can perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if employee.interviewer != hr:
            return Response(
                {"detail": "You are not the assigned interviewer for this employee."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if employee.interview_state != "done":
            return Response(
                {
                    "detail": f"Cannot accept employee with current interview status: '{employee.interview_state}'."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().partial_update(request, *args, **kwargs)


class HRRejectEmployeeViewSet(ModelViewSet):
    """
    Permanently deletes applicant record
    - Sends rejection email first
    - Complete deletion from DB
    """

    queryset = Employee.objects.exclude(interview_state="accepted")
    serializer_class = EmployeeRejectingSerializer
    permission_classes = [IsAuthenticated, IsHR]
    http_method_names = ["delete"]

    def destroy(self, request, pk=None):
        employee = self.get_object()

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response(
                {"detail": "Only HRs can perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Only interviewer can reject
        if employee.interviewer != hr:
            return Response(
                {"detail": "You are not the assigned interviewer for this employee."},
                status=status.HTTP_403_FORBIDDEN,
            )

        send_mail(
            subject="Application Status – Not Selected",
            message=f"Dear {employee.user.basicinfo.username},\n\nThank you for your interest in the position. "
            f"Unfortunately, we will not be moving forward with you.\n\nBest regards,\nHR Team",
            from_email="tempohr44@gmail.com",
            recipient_list=[employee.user.username],
            fail_silently=False,
        )

        # ✅ Delete: User → BasicInfo → Employee
        user = employee.user
        employee.delete()
        user.delete()  # This will cascade and delete BasicInfo due to OneToOne

        return Response(
            {"detail": "applicant deleted"}, status=status.HTTP_204_NO_CONTENT
        )


class TaskViewSet(ModelViewSet):

    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    # Create Task (by coordinator)
    def create(self, request, *args, **kwargs):
        # 1. Verify coordinator status with existence check
        try:
            if not request.user.employee.is_coordinator:
                return Response(
                    {"error": "Only coordinators can create tasks"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except AttributeError:
            return Response(
                {"error": "User has no associated employee profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        assigned_id = request.data.get("assigned_to")
        try:
            assigned_emp = Employee.objects.get(id=assigned_id)
        except Employee.DoesNotExist:
            return Response(
                {"error": "Assigned employee not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if assigned_emp.is_coordinator:
            return Response(
                {
                    "error": "You cannot assign tasks to yourself or another coordinator like you."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if assigned_emp.position != request.user.employee.position:
            return Response(
                {
                    "error": "You can only assign tasks to employees with the same position as yours."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Create task instance directly (bypassing serializer for creation)
        try:
            task = Task.objects.create(
                created_by=request.user.employee,
                assigned_to=assigned_emp,
                title=request.data["title"],
                description=request.data["description"],
                deadline=request.data["deadline"],
                is_submitted=False,
                is_accepted=False,
                is_refused=False,
            )

            # 3. Return serialized data
            serializer = self.get_serializer(task)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except KeyError as e:
            return Response(
                {"error": f"Missing required field: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Submit Task (by assigned employee)
    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        task = get_object_or_404(Task, pk=pk)

        # Check 1: Must be the assigned employee
        if task.assigned_to.user != request.user:
            return Response(
                {"error": "Only the assigned employee can submit this task."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check 2: Task must not already be submitted
        if task.is_submitted:
            return Response(
                {"error": "Task is already submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.FILES:
            for file in request.FILES.getlist("files"):
                File.objects.create(file=file, task=task)
        else:
            return Response(
                {"error": "At least one file is required for submission."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update task status
        task.is_submitted = True
        task.submission_time = timezone.now()
        task.is_refused = False  # Reset refusal if resubmitted
        task.save()

        return Response(
            {"message": "Task submitted successfully."}, status=status.HTTP_200_OK
        )

    # Accept Task (by creator/coordinator)
    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        task = get_object_or_404(Task, pk=pk)

        # Check 1: Must be the creator
        if task.created_by.user != request.user:
            return Response(
                {"error": "Only the task creator can accept this task."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check 2: Must be submitted and not already accepted/refused
        if not task.is_submitted:
            return Response(
                {"error": "Task must be submitted before acceptance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if task.is_accepted:
            return Response(
                {"error": "Task is already accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get rating from request
        rating = request.data.get("rating")
        if rating is None:
            return Response(
                {"error": "Rating is required for acceptance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            rating = float(rating)
            if not (0 <= rating <= 100):
                raise ValueError
        except ValueError:
            return Response(
                {"error": "Rating must be a number between 0 and 100."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate time remaining (in hours)
        time_remaining = (task.deadline - task.submission_time).total_seconds() / 3600

        # Update task
        task.is_accepted = True
        task.is_refused = False  # In case it was previously refused and the creator changed their mind
        task.rating = rating
        task.time_remaining_before_deadline_when_accepted = time_remaining
        task.save()

        employee = task.assigned_to
        employee.total_task_ratings += rating
        employee.total_time_remaining_before_deadline += time_remaining
        employee.number_of_accepted_tasks += 1
        employee.save(update_fields=[
            "total_task_ratings",
            "total_time_remaining_before_deadline",
            "number_of_accepted_tasks",
        ])

        return Response(
            {
                "message": "Task accepted successfully.",
                "time_remaining_hours": round(time_remaining, 2),
                "rating": rating,
            },
            status=status.HTTP_200_OK,
        )

    # Refuse Task (by creator/coordinator)
    @action(detail=True, methods=["post"])
    def refuse(self, request, pk=None):
        task = get_object_or_404(Task, pk=pk)

        # Check 1: Must be the creator
        if task.created_by.user != request.user:
            return Response(
                {"error": "Only the task creator can refuse this task."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check 2: Must be submitted and not already accepted
        if not task.is_submitted:
            return Response(
                {"error": "Task must be submitted before refusal."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if task.is_accepted:
            return Response(
                {"error": "Task is already accepted and cannot be refused."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get refusal reason
        reason = request.data.get("reason")
        if not reason:
            return Response(
                {"error": "Reason is required for refusal."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update task
        task.is_submitted = False  # Reset submission
        task.is_refused = True
        task.refuse_reason = reason
        task.save()

        return Response(
            {"message": "Task refused successfully.", "reason": reason},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def my_created_tasks(self, request):
        tasks = Task.objects.filter(created_by=request.user.employee)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def my_assigned_tasks(self, request):
        tasks = Task.objects.filter(assigned_to=request.user.employee)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)


class AdminPromoteEmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=True, methods=["post"], url_path="promote")
    def promote(self, request, pk=None):
        try:
            employee = self.get_object()
        except Employee.DoesNotExist:
            return Response(
                {"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if employee.is_coordinator:
            return Response(
                {"detail": "Employee is already promoted."}, status=status.HTTP_200_OK
            )

        employee.is_coordinator = True
        employee.save()

        return Response(
            {"detail": "Employee promoted to coordinator successfully."},
            status=status.HTTP_200_OK,
        )


class ViewSelfViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        basicinfo = user.basicinfo
        role = basicinfo.role

        user_data = UserSerializer(user).data
        basicinfo_data = BasicInfoSerializer(basicinfo).data

        if role == "hr":
            try:
                hr = HR.objects.get(user=user)
                hr_data = HRSerializer(hr).data
                return Response(
                    {
                        "role": "hr",
                        "user": user_data,
                        "basicinfo": basicinfo_data,
                        "hr": hr_data,
                    }
                )
            except HR.DoesNotExist:
                return Response({"detail": "HR profile not found."}, status=404)

        elif role == "employee":
            try:
                emp = Employee.objects.get(user=user)
                emp_data = EmployeeSerializer(emp).data
                return Response(
                    {
                        "role": "employee",
                        "user": user_data,
                        "basicinfo": basicinfo_data,
                        "employee": emp_data,
                    }
                )
            except Employee.DoesNotExist:
                return Response({"detail": "Employee profile not found."}, status=404)

        elif role == "admin":
            return Response(
                {"role": "admin", "user": user_data, "basicinfo": basicinfo_data}
            )

        return Response({"detail": "Unknown role."}, status=status.HTTP_400_BAD_REQUEST)


class CoordinatorViewEmployeesViewSet(ModelViewSet):
    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated, IsCoordinator]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['region']
    search_fields = ['user__username', 'user__email', 'user__basicinfo__username']
    http_method_names = ['get']

    def get_queryset(self):
        emp = self.request.user.employee
        return Employee.objects.filter(
            is_coordinator=False,
            position=emp.position,
            interview_state='accepted'
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EmployeeSerializer
        return super().get_serializer_class()
    


class HRManageRegionsViewSet(ModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [IsAuthenticated, IsHR]
    http_method_names = ["get", "post"]


class AdminManageRegionsViewSet(ModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "post"]


class HRManageEducationDegreesViewSet(ModelViewSet):
    queryset = EducationDegree.objects.all()
    serializer_class = EducationDegreeSerializer
    permission_classes = [IsAuthenticated, IsHR]
    http_method_names = ["get", "post"]


class AdminManageEducationDegreesViewSet(ModelViewSet):
    queryset = EducationDegree.objects.all()
    serializer_class = EducationDegreeSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "post"]


class HRManageEducationFieldsViewSet(ModelViewSet):
    queryset = EducationField.objects.all()
    serializer_class = EducationFieldSerializer
    permission_classes = [IsAuthenticated, IsHR]
    http_method_names = ["get", "post"]


class AdminManageEducationFieldsViewSet(ModelViewSet):
    queryset = EducationField.objects.all()
    serializer_class = EducationFieldSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "post"]

class EmployeePredictionViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'], url_path='predict-and-update')
    def predict_and_update_metrics(self, request, pk=None):
        """
        Predicts and updates all metrics for a specific employee
        POST /api/employees/{id}/predict-and-update/
        """
        employee = self.get_object()
        
        # Validate required fields
        required_fields = {
            'region': employee.region,
            'highest_education_degree': employee.highest_education_degree,
            'highest_education_field': employee.highest_education_field,
            'years_of_experience': employee.years_of_experience,
            'had_leadership_role': employee.had_leadership_role,
            'percentage_of_matching_skills': employee.percentage_of_matching_skills,
            'has_position_related_high_education': employee.has_position_related_high_education,
        }
        
        missing_fields = [field for field, value in required_fields.items() if value is None]
        if missing_fields:
            return Response(
                {
                    "error": "Cannot make predictions - missing required employee data",
                    "missing_fields": missing_fields
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare input data for prediction
        input_data = np.array([[
            employee.region.distance_to_work,
            employee.highest_education_degree.id,
            employee.highest_education_field.id,
            employee.years_of_experience,
            int(employee.had_leadership_role),
            employee.percentage_of_matching_skills,
            int(employee.has_position_related_high_education),
        ]])
        
        # Load models and make predictions
        MODELS_DIR = os.path.join('api', 'predictive_models')
        predictions = {}
        
        try:
            # Salary prediction
            salary_model = joblib.load(os.path.join(MODELS_DIR, 'salary_model.pkl'))
            predictions['predicted_basic_salary'] = float(salary_model.predict(input_data)[0])
            
            # Task rating prediction
            task_model = joblib.load(os.path.join(MODELS_DIR, 'task_ratings_model.pkl'))
            predictions['predicted_avg_task_rating'] = float(task_model.predict(input_data)[0])
            
            # Time remaining prediction
            time_model = joblib.load(os.path.join(MODELS_DIR, 'time_remaining_model.pkl'))
            predictions['predicted_avg_time_remaining_before_deadline'] = float(time_model.predict(input_data)[0])
            
            # Overtime prediction
            overtime_model = joblib.load(os.path.join(MODELS_DIR, 'overtime_hours_model.pkl'))
            predictions['predicted_avg_overtime_hours'] = float(overtime_model.predict(input_data)[0])
            
            # Lateness prediction
            lateness_model = joblib.load(os.path.join(MODELS_DIR, 'lateness_hours_model.pkl'))
            predictions['predicted_avg_lateness_hours'] = float(lateness_model.predict(input_data)[0])
            
            # Absence prediction
            absence_model = joblib.load(os.path.join(MODELS_DIR, 'absent_days_model.pkl'))
            predictions['predicted_avg_absent_days'] = float(absence_model.predict(input_data)[0])
            
            # Update employee with predictions
            for field, value in predictions.items():
                setattr(employee, field, value)
            
            # Update prediction timestamp
            employee.last_prediction_date = timezone.now()
            employee.save()
            
            # Return updated employee data
            serializer = self.get_serializer(employee)
            return Response({
                "status": "Predictions updated successfully",
            }, status=status.HTTP_200_OK)
            
        except FileNotFoundError as e:
            return Response(
                {"error": f"Model file not found: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {"error": f"Prediction failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminStatsViewSet(ModelViewSet):
    """
    GET: List historical company statistics snapshots.
    POST: Calculate new statistics and create a new snapshot.
    """
    queryset = CompanyStatistics.objects.all().order_by('-generated_at')
    serializer_class = CompanyStatisticsSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ['get', 'post']
    
    def create(self, request, *args, **kwargs):
        # Calculate statistics on demand.
        stats = calculate_statistics()
        
        # Save the new snapshot.
        company_stats = CompanyStatistics.objects.create(
            total_employees=stats['total_employees'],
            total_hrs=stats['total_hrs'],
            position_stats=stats['position_stats'],
            monthly_salary_totals=stats['monthly_salary_totals'],
            overall_avg_task_rating=stats['overall_avg_task_rating'],
            overall_avg_time_remaining=stats['overall_avg_time_remaining'],
            overall_avg_overtime=stats['overall_avg_overtime'],
            overall_avg_lateness=stats['overall_avg_lateness'],
            overall_avg_absent_days=stats['overall_avg_absent_days'],
            overall_avg_salary=stats['overall_avg_salary'],
        )
        
        serializer = self.get_serializer(company_stats)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='latest')
    def latest(self, request):
        latest_stat = self.get_queryset().first()
        if latest_stat:
            serializer = self.get_serializer(latest_stat)
            return Response(serializer.data)
        return Response({"detail": "No statistics available."}, status=404)

class HRStatsViewSet(ModelViewSet):
    """
    Dedicated ViewSet for HR statistics calculations
    Only allows HR users to calculate their own stats
    """
    queryset = HR.objects.all()
    serializer_class = HRSerializer
    permission_classes = [IsAuthenticated, IsHR]

    def get_queryset(self):
        """HR users can only see their own profile"""
        qs = super().get_queryset()
        return qs.filter(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='calculate-my-stats')
    def calculate_my_stats(self, request):
        """
        Endpoint for HR users to recalculate their own statistics
        POST /api/hr-stats/calculate-my-stats/
        """
        hr_profile = self.get_queryset().first()  # Gets the HR's own profile
        
        if not hr_profile:
            return Response(
                {"error": "HR profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        hr_profile.calculate_accepted_employees_stats()
        
        return Response(
            {
                "status": "success",
                "message": "Your HR statistics have been recalculated",
                "hr_id": hr_profile.id,
                "user_id": request.user.id
            },
            status=status.HTTP_200_OK
        )






class AdminRankViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Employee.objects.none()  # Required by ModelViewSet, but unused

    @action(detail=False, methods=['post'], url_path='rank-employees')
    def rank_employees(self, request):
        expected_fields = {
            "avg_task_rating", "avg_time_remaining", "avg_overtime", "avg_lateness", "avg_absent"
        }
        weights = request.data.get("weights", {})

        if not expected_fields.issubset(weights):
            return Response({"detail": f"Missing weights: {expected_fields - set(weights)}"}, status=400)

        for key, val in weights.items():
            try:
                fval = float(val)
                if fval < -1 or fval > 1:
                    return Response({"detail": f"Weight {key} must be between -1 and 1."}, status=400)
            except:
                return Response({"detail": f"Weight {key} must be a number."}, status=400)

        employees = Employee.objects.filter(interview_state='accepted')
        ranked = []

        for emp in employees:
            num_tasks = emp.number_of_accepted_tasks
            num_days = emp.number_of_non_holiday_days_since_join

            avg_task_rating = emp.total_task_ratings / num_tasks if num_tasks else 0
            avg_time_remaining = emp.total_time_remaining_before_deadline / num_tasks if num_tasks else 0
            avg_overtime = emp.total_overtime_hours / num_days if num_days else 0
            avg_lateness = emp.total_lateness_hours / num_days if num_days else 0
            avg_absent = emp.total_absent_days / num_days if num_days else 0

            score = (
                avg_task_rating * float(weights["avg_task_rating"]) +
                avg_time_remaining * float(weights["avg_time_remaining"]) +
                avg_overtime * float(weights["avg_overtime"]) +
                avg_lateness * float(weights["avg_lateness"]) +
                avg_absent * float(weights["avg_absent"])
            )

            ranked.append((emp, score))

        ranked.sort(key=lambda x: x[1], reverse=True)

        for i, (emp, _) in enumerate(ranked, start=1):
            emp.rank = i
            emp.save(update_fields=['rank'])

        return Response({"detail": f"{len(ranked)} employees ranked successfully."})

    @action(detail=False, methods=['post'], url_path='rank-hrs')
    def rank_hrs(self, request):
        available_fields = {
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
        }

        weights = request.data.get("weights", {})
        if not weights:
            return Response({"detail": "Missing 'weights' object in request."}, status=400)

        unknown = set(weights.keys()) - available_fields
        if unknown:
            return Response({"detail": f"Invalid fields: {unknown}"}, status=400)

        for key, val in weights.items():
            try:
                fval = float(val)
                if fval < -1 or fval > 1:
                    return Response({"detail": f"Weight {key} must be between -1 and 1."}, status=400)
            except:
                return Response({"detail": f"Weight {key} must be a number."}, status=400)

        hrs = HR.objects.exclude(accepted_employees_avg_task_rating__isnull=True)
        ranked = []

        for hr in hrs:
            score = 0
            for field, weight in weights.items():
                val = getattr(hr, field, 0)
                score += float(weight) * (val if val is not None else 0)
            ranked.append((hr, score))

        ranked.sort(key=lambda x: x[1], reverse=True)

        for i, (hr, _) in enumerate(ranked, start=1):
            hr.rank = i
            hr.save(update_fields=['rank'])

        return Response({"detail": f"{len(ranked)} HRs ranked successfully."})





class AdminViewTopViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = None

    @action(detail=False, methods=['get'], url_path='top-employees')
    def top_employees(self, request):
        top_emps = Employee.objects.filter(
            interview_state='accepted',
            rank__isnull=False
        ).select_related('user').order_by('rank')[:10]

        result = []

        for emp in top_emps:
            num_tasks = emp.number_of_accepted_tasks
            num_days = emp.number_of_non_holiday_days_since_join

            avg_task_rating = round(emp.total_task_ratings / num_tasks, 2) if num_tasks else None
            avg_time_remaining = round(emp.total_time_remaining_before_deadline / num_tasks, 2) if num_tasks else None
            avg_overtime = round(emp.total_overtime_hours / num_days, 2) if num_days else None
            avg_lateness = round(emp.total_lateness_hours / num_days, 2) if num_days else None
            avg_absent = round(emp.total_absent_days / num_days, 2) if num_days else None

            result.append({
                "rank": emp.rank,
                "username": emp.user.basicinfo.username,  # Assuming basicinfo holds the display username
                "avg_task_rating": avg_task_rating,
                "avg_time_remaining": avg_time_remaining,
                "avg_overtime": avg_overtime,
                "avg_lateness": avg_lateness,
                "avg_absent": avg_absent,
            })

        return Response(result)
    
    @action(detail=False, methods=['get'], url_path='top-hrs')
    def top_hrs(self, request):
        top_hrs = HR.objects.filter(
            rank__isnull=False
        ).select_related('user').order_by('rank')[:10]

        result = []
        for hr in top_hrs:
            result.append({
                "rank": hr.rank,
                "username": hr.user.basicinfo.username,
                "avg_task_rating": hr.accepted_employees_avg_task_rating,
                "avg_time_remaining": hr.accepted_employees_avg_time_remaining,
                "avg_lateness_hrs": hr.accepted_employees_avg_lateness_hrs,
                "avg_absence_days": hr.accepted_employees_avg_absence_days,
                "avg_salary": hr.accepted_employees_avg_salary,
                "avg_overtime": hr.accepted_employees_avg_overtime,
                "avg_interviewer_rating": hr.accepted_employees_avg_interviewer_rating,
                "rating_to_task_rating_correlation": hr.interviewer_rating_to_task_rating_correlation,
                "rating_to_time_remaining_correlation": hr.interviewer_rating_to_time_remaining_correlation,
                "rating_to_lateness_hrs_correlation": hr.interviewer_rating_to_lateness_hrs_correlation,
                "rating_to_absence_days_correlation": hr.interviewer_rating_to_absence_days_correlation,
                "rating_to_avg_overtime_correlation": hr.interviewer_rating_to_avg_overtime_correlation,
            })

        return Response(result)
    
class HRViewTopInterviewedEmployeesViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    permission_classes = [IsAuthenticated, IsHR]
    serializer_class = None  # not used

    def list(self, request, *args, **kwargs):
        top_emps = Employee.objects.filter(
            interviewer=request.user.hr,
            interview_state='accepted',
            rank__isnull=False
        ).select_related('user', 'user__basicinfo').order_by('rank')[:10]

        result = []

        for emp in top_emps:
            num_tasks = emp.number_of_accepted_tasks
            num_days = emp.number_of_non_holiday_days_since_join

            avg_task_rating = round(emp.total_task_ratings / num_tasks, 2) if num_tasks else None
            avg_time_remaining = round(emp.total_time_remaining_before_deadline / num_tasks, 2) if num_tasks else None
            avg_overtime = round(emp.total_overtime_hours / num_days, 2) if num_days else None
            avg_lateness = round(emp.total_lateness_hours / num_days, 2) if num_days else None
            avg_absent = round(emp.total_absent_days / num_days, 2) if num_days else None

            result.append({
                "username": emp.user.basicinfo.username,
                "rank": emp.rank,
                "avg_task_rating": avg_task_rating,
                "avg_time_remaining": avg_time_remaining,
                "avg_overtime": avg_overtime,
                "avg_lateness": avg_lateness,
                "avg_absent": avg_absent,
            })

        return Response(result)
    
class HRUpdateEmployeeCVDateViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer  # Your existing serializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update_cv_data']:
            return [IsAuthenticated, IsHR]
        return super().get_permissions()

    @action(detail=True, methods=['patch'], url_path='update-cv-data')
    def update_cv_data(self, request, pk=None):
        employee = self.get_object()
        serializer = EmployeeCVUpdateSerializer(
            instance=employee,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            # Handle skills separately
            skills = request.data.get('skills', None)
            
            # Save all fields except skills
            employee = serializer.save()
            
            # Update skills if provided
            if skills is not None:
                employee.skills.set(skills)
            
            return Response(
                {"message": "CV data updated successfully"},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)