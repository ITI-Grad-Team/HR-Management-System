from rest_framework.viewsets import ModelViewSet
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db import transaction
from .models import Employee, ApplicationLink, Skill
from .serializers import EmployeeSerializer


# utils/llm_utils.py (testing mock)
def extract_info_from_cv(cv, skills_choices, degree_choices, region_choices, field_choices):
    # This is a mock implementation for testing purposes
    return {
        "region": region_choices[0] if region_choices else "Unknown",
        "degree": degree_choices[0] if degree_choices else "Unknown",
        "field": field_choices[0] if field_choices else "Unknown",
        "experience": 3,
        "had_leadership": True,
        "skills": skills_choices[:2],  # return first two as matched
        "has_position_related_high_education": True
    }

# region_distance_map.py (testing mock)
REGION_DISTANCE_MAP = {
    "Cairo": 10.0,
    "Giza": 15.0,
    "Alexandria": 25.0,
    "Aswan": 100.0,
    "Unknown": 0.0
}


from .models import User, BasicInfo, HR, Employee, ApplicationLink, Skill,EducationDegree,Region,EducationField, InterviewQuestion, OvertimeClaim, Task, File, Position, Report
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Employee
from .serializers import EmployeeSerializer
from .permissions import IsHR,IsAdmin,IsHRorAdmin,IsEmployee
from .serializers import (
    UserSerializer,
    BasicInfoSerializer,
    HRSerializer,
    EmployeeSerializer,
    ApplicationLinkSerializer,
    SkillSerializer,
    InterviewQuestionSerializer,
    OvertimeClaimSerializer,
    TaskSerializer,
    FileSerializer,
    PositionSerializer,
    ReportSerializer,

)
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
import random
import string


class AdminInviteHRViewSet(ModelViewSet):
    """
    Allows admin to invite new HRs by email
    - Creates HR account with email
    - Generates random password based on timestamp
    - Sends email with credentials
    - Only accessible by admin role
    """
    queryset = User.objects.none()  # Will be customized in get_queryset
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=email).exists():
            return Response({'error': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        user = User.objects.create_user(username=email, email=email, password=password)

        HR.objects.create(
            user=user,
            accepted_employees_avg_task_rating=0,
            accepted_employees_avg_time_remaining=0,
            accepted_employees_avg_lateness_hrs=0,
            accepted_employees_avg_absence_days=0,
            )
        
        BasicInfo.objects.create(
        user=user,
        role='HR',
        username=email,
        )
        
        send_mail(
            subject='Invitation to join HR Portal',
            message=f"Your account has been created.\nUsername: {email}\nPassword: {password}",
            from_email='tempohr44@gmail.com',
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({'message': 'Invitation sent successfully.'}, status=status.HTTP_201_CREATED)

class AdminViewHRsViewSet(ModelViewSet):
    queryset = HR.objects.all()
    serializer_class = HRSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [SearchFilter]
    search_fields = ['user__username', 'user__email']


class AdminViewEmployeesViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['region', 'position', 'is_coordinator']
    search_fields = ['user__username', 'phone']

class AdminViewUsersViewSet(ModelViewSet):
    """
    Displays all users (employees + HRs) in card format
    - Provides summary info and statistics visualization
    - Only accessible by admin role
    - Includes filters for different statistics (e.g., avg lateness)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class AdminPromoteEmployeeViewSet(ModelViewSet):
    """
    Promotes employee from task submitter to task receiver
    - Toggles is_coordinator flag
    - Only accessible by admin role
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]



class HRManageApplicationLinksViewSet(ModelViewSet):
    """
    Allows HR to generate application links
    - Creates unique link with position, skills, role, max applicants
    - Only accessible by HR role
    """
    queryset = ApplicationLink.objects.all()
    serializer_class = ApplicationLinkSerializer
    permission_classes = [IsAuthenticated,IsHR]
    # in frontend, the URL will be constructed based on "distinction_name"
    # ex. if "junior-frontend-2025", then: "http://localhost:3000/apply/junior-frontend-2025/" → shown in a non-editable field

    # skills and position will be passed as FKs (fetched from DB — name shown in a list, value submitted as the FK)
    # new skill/position? there is an api to create one (button side by side to the dd list in front)




class PublicApplicantsViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    http_method_names = ['post']

    def create(self, request, *args, **kwargs):
        data = request.data

        email = data.get("email")
        phone = data.get("phone")
        cv = data.get("cv")
        distinction_name = data.get("distinction_name")
        is_coordinator = data.get("is_coordinator", False)

        if not all([email, phone, cv, distinction_name]):
            return Response({"detail": "Missing required fields."}, status=400)

        # 1. Get ApplicationLink
        try:
            application_link = ApplicationLink.objects.get(distinction_name=distinction_name)
        except ApplicationLink.DoesNotExist:
            return Response({"detail": "Invalid distinction name."}, status=400)

        if User.objects.filter(username=email).exists():
            return Response({"detail": "User already exists."}, status=400)

        # 2. Extract info from CV
        all_skills = list(Skill.objects.values_list("name", flat=True))
        degree_choices = list(EducationDegree.objects.values_list("name", flat=True))
        region_choices = list(Region.objects.values_list("name", flat=True))
        field_choices = list(EducationField.objects.values_list("name", flat=True))
        cv_info = extract_info_from_cv(
            cv,
            skills_choices=all_skills,
            degree_choices=degree_choices,
            region_choices=region_choices,
            field_choices=field_choices
        )  # This returns a dict

        try:
            region_name = cv_info["region"]
            degree_name = cv_info["degree"]
            experience = cv_info["experience"]
            had_leadership = cv_info["had_leadership"]
            emp_skill_names = cv_info["skills"]
            has_relevant_edu = cv_info["has_position_related_high_education"]
            field_name = cv_info["field"]
        except KeyError as e:
            return Response({"detail": f"Missing LLM-extracted field: {str(e)}"}, status=400)

        # 3. Calculate percentage of matching skills
        required_skills = application_link.skills.all()
        employee_skills = Skill.objects.filter(name__in=emp_skill_names)
        relevant_emp_skills = employee_skills.filter(id__in=required_skills)
        match_count = relevant_emp_skills.count()
        percentage = (match_count / required_skills.count()) * 100 if required_skills.exists() else 0

        # 4. Distance to work
        distance = REGION_DISTANCE_MAP.get(region_name, 0.0)

        # 5. Create or get foreign key instances
        try:
            region = Region.objects.get(name=region_name)
            degree = EducationDegree.objects.get(name=degree_name)
            field = EducationField.objects.get(name=field_name)
        except (Region.DoesNotExist, EducationDegree.DoesNotExist, EducationField.DoesNotExist) as e:
            return Response({"detail": f"Missing FK object: {str(e)}"}, status=400)

        # 6. Create User & Employee
        with transaction.atomic():
            user = User.objects.create(username=email)
            user.set_unusable_password()
            user.save()

            employee = Employee.objects.create(
                user=user,
                phone=phone,
                cv=cv,
                position=application_link.position,
                is_coordinator=is_coordinator,
                application_link=application_link,
                region=region,
                highest_education_degree=degree,
                highest_education_field=field,
                years_of_experience=experience,
                had_leadership_role=had_leadership,
                percentage_of_matching_skills=percentage,
                has_position_related_high_education=has_relevant_edu,
                distance_to_work=distance,
                predicted_avg_task_rating=0,
                predicted_avg_time_remaining_before_deadline=0,
                predicted_avg_attendance_lateness_hrs=0,
                predicted_avg_absence_days=0,
            )

            employee.skills.set(employee_skills)

        return Response({"detail": "Application submitted successfully."}, status=status.HTTP_201_CREATED)

    

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
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsHR]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['region', 'position', 'is_coordinator']
    search_fields = ['user__username', 'phone']

class HRViewApplicantsViewSet(ModelViewSet):
    """
    Shows applicants for a specific application link
    - Displays in table format with all applicant details
    - Only accessible by HR role
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]


class HRInterviewViewSet(ModelViewSet):
    """
    Manages interview process
    - Set interview datetime (triggers email)
    - Add questions (with AI suggestions)
    - Score questions and calculate average
    - Mark as pending acceptance/rejection
    - Only accessible by HR role
    """
    queryset = InterviewQuestion.objects.all()
    serializer_class = InterviewQuestionSerializer
    permission_classes = [IsAuthenticated]

class PublicApplicationViewSet(ModelViewSet):
    """
    Handles job applications through public links
    - Creates employee record with:
      * email, phone, CV (from form)
      * position, is_coordinator (from ApplicationLink)
      * Extracted CV data (region, education, etc.)
      * Predicted performance metrics
    - Decrements application link count
    """
    queryset = Employee.objects.none()
    serializer_class = EmployeeSerializer

    def create(self, request, unique_name=None):
        # Steps:
        pass

class HRAcceptApplicantViewSet(ModelViewSet):
    """
    Converts applicant to active employee by:
    - Setting password (generated/time-based)
    - Sending welcome email with credentials
    - Does NOT require additional fields
    """
    queryset = Employee.objects.filter(join_date__isnull=True)
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, pk=None):
        # Steps:
        # 1. Generate password
        # 2. Set join_date=now()
        # 3. Send email with credentials
        # 4. Return 200
        pass


class HRRejectApplicantViewSet(ModelViewSet):
    """
    Permanently deletes applicant record
    - Sends rejection email first
    - Complete deletion from DB
    """
    queryset = Employee.objects.filter(join_date__isnull=True)
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, pk=None):
        # Steps:
        # 1. Send rejection email
        # 2. Delete User+Employee records
        # 3. Return 204
        # return Response(status=204)
        pass

class HROvertimeApprovalViewSet(ModelViewSet):
    """
    Views and approves/rejects overtime claims
    - Approved time added to employee record
    - Only accessible by HR role
    """
    queryset = OvertimeClaim.objects.all()
    serializer_class = OvertimeClaimSerializer
    permission_classes = [IsAuthenticated]

class HRSalaryReportsViewSet(ModelViewSet):
    """
    Views monthly salary reports
    - Employee-wise breakdown
    - Only accessible by HR role
    """
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

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

class EmployeeTaskViewSet(ModelViewSet):
    """
    Manages task workflow for employees
    - Task submitters: view assigned tasks, submit work
    - Task receivers: view all submitter employees, assign tasks, review submissions
    - Access controlled by is_coordinator flag
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

class EmployeeOvertimeClaimViewSet(ModelViewSet):
    """
    Handles overtime claim submission
    - Available when grace period passes after late check-out
    - Only accessible by employee role
    """
    queryset = OvertimeClaim.objects.all()
    serializer_class = OvertimeClaimSerializer
    permission_classes = [IsAuthenticated]

class ApplicationLinkPublicViewSet(ModelViewSet):
    """
    Public endpoint for job application links
    - Shows application form if limit not reached
    - Processes applications with CV parsing and ATS filtering
    - No authentication required
    """
    queryset = ApplicationLink.objects.all()
    serializer_class = ApplicationLinkSerializer

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