from rest_framework.viewsets import ModelViewSet
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from .models import Task
from .serializers import TaskSerializer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db import transaction
from .models import Employee, ApplicationLink, Skill
from .serializers import EmployeeSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Task
from .serializers import TaskSerializer
from .cv_processing.LLM_utils import TogetherCVProcessor
from django.utils.dateparse import parse_datetime
from django.db.models import Avg
def recalculate_interview_avg_grade(employee):
    avg = InterviewQuestion.objects.filter(employee=employee).aggregate(Avg('grade'))['grade__avg']
    employee.interview_questions_avg_grade = avg
    employee.save(update_fields=['interview_questions_avg_grade'])
from django.utils.dateformat import format as django_format
from django.utils.timezone import localtime,make_aware, is_naive



# # utils/llm_utils.py (testing mock)
# def extract_info_from_cv(cv, skills_choices, degree_choices, region_choices, field_choices):
#     # This is a mock implementation for testing purposes
#     return {
#         "region": region_choices[0] if region_choices else "Unknown",
#         "degree": degree_choices[0] if degree_choices else "Unknown",
#         "field": field_choices[0] if field_choices else "Unknown",
#         "experience": 3,
#         "had_leadership": True,
#         "skills": skills_choices[:2],  # return first two as matched
#         "has_position_related_high_education": True
#     }


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
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import EmployeeSerializer
from django.utils import timezone
from .permissions import IsEmployee
from django.shortcuts import get_object_or_404
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
    EmployeeDataSerializer,
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
        user = User.objects.create_user(username=email, password=password)

        HR.objects.create(
            user=user,
            accepted_employees_avg_task_rating=0,
            accepted_employees_avg_time_remaining=0,
            accepted_employees_avg_lateness_hrs=0,
            accepted_employees_avg_absence_days=0,
            )
        
        BasicInfo.objects.create(
        user=user,
        role='hr',
        username=email.split("@")[0]  
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

        processor = TogetherCVProcessor()
        
        llm_success = False
        cv_info = {}

        try:
            cv_info = processor.extract_info(
                cv_file=cv,
                choices={
                    'skills': all_skills,
                    'degrees': degree_choices,
                    'regions': region_choices,
                    'fields': field_choices
                },
                position=application_link.position
            )
            print(cv_info)
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
            percentage = (relevant_emp_skills.count() / required_skills.count()) * 100 if required_skills.exists() else 0

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
                "phone": phone,
                "cv": cv,
                "position": application_link.position,
                "is_coordinator": is_coordinator,
                "application_link": application_link
            }

            # Optional fields
            if region: employee_data["region"] = region
            if degree: employee_data["highest_education_degree"] = degree
            if field: employee_data["highest_education_field"] = field
            if experience is not None: employee_data["years_of_experience"] = experience
            if had_leadership is not None: employee_data["had_leadership_role"] = had_leadership
            if percentage is not None: employee_data["percentage_of_matching_skills"] = percentage
            if has_relevant_edu is not None: employee_data["has_position_related_high_education"] = has_relevant_edu

            employee = Employee.objects.create(**employee_data)

            if skills_list:
                employee.skills.set(skills_list)

            BasicInfo.objects.create(
                user=user,
                role='employee',
                username=email.split("@")[0]
            )
        message = "Application submitted successfully."
        if not llm_success:
            message += " (Note: CV parsing failed, submitted with required data only.)"

        return Response({
            "detail": message,
            "llm_success": llm_success
        }, status=status.HTTP_201_CREATED)

    

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


    @action(detail=True, methods=['patch'], url_path='schedule-interview')
    def schedule_interview(self, request, pk=None):
        # a field right in the frontend record! .. this should sent the employee an email 
        # the main purpose is to indicate that the interview is scheduled
        # it should send the employee an email btw!!!!!!
        employee = self.get_object()

        interview_datetime_str = request.data.get("interview_datetime")
        if not interview_datetime_str:
            return Response({"detail": "Missing interview_datetime."}, status=400)

        interview_datetime = parse_datetime(interview_datetime_str)
        if not interview_datetime:
            return Response({"detail": "Invalid datetime format. Use ISO format like 2025-07-01T14:00:00"}, status=400)

        # Ensure datetime is timezone-aware
        if is_naive(interview_datetime):
            interview_datetime = make_aware(interview_datetime)

        employee.interview_datetime = interview_datetime
        employee.interview_state = "scheduled"
        employee.save()

        # Format for email
        formatted_dt = django_format(localtime(interview_datetime), "l, F j, Y \\a\\t h:i A")

        send_mail(
            subject='Interview Scheduled',
            message=f"Your interview has been scheduled for {formatted_dt}.\n\nPlease be on time.\n\nBest regards,\nHR Team",
            from_email='tempohr44@gmail.com',
            recipient_list=[employee.user.username],
            fail_silently=False,
        )

        return Response({"detail": "Interview scheduled and email sent successfully."})


    @action(detail=True, methods=['patch'], url_path='take-interviewee')
    def start_interview_now(self, request, pk=None):
        # this is just interviewer field setting, it can happen by whoever hr, whenever possible
        # there should be a button directing to a react page with the emp id, so it is fetched and manipulated there
        # in that page there should be a button to [take interviewee], it doesnt check time. it just checks the user (hr)

        employee = self.get_object()

        if employee.interviewer is not None:
            return Response({"detail": "This interviewee has already been taken"}, status=400)

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Current user is not an HR."}, status=403)

        employee.interviewer = hr
        employee.save()

        return Response({"detail": "Interviewee taken successfully."})
    
    @action(detail=True, methods=['post'], url_path='add-question')
    def add_interview_question(self, request, pk=None):
        """
        Adds an interview question and its grade. 
        Only the HR assigned as the interviewer can perform this.
        """
        employee = self.get_object()

        if employee.interview_state == 'done' or employee.interview_state == 'accepted':
            return Response({"detail": "Interview is already completed. You cannot modify it."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can add interview questions."}, status=status.HTTP_403_FORBIDDEN)

        if employee.interviewer != hr:
            return Response({"detail": "You are not the interviewer assigned to this employee."}, status=status.HTTP_403_FORBIDDEN)

        text = request.data.get("text")
        grade = 0

        if not text :
            return Response({"detail": "Missing text"}, status=status.HTTP_400_BAD_REQUEST)


        InterviewQuestion.objects.create(
            text=text,
            grade=grade,
            employee=employee
        )

        recalculate_interview_avg_grade(employee)

        return Response({"detail": "Interview question added successfully."}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'], url_path='update-question-grade')
    def update_question_grade(self, request, pk=None):
        """
        In front, questions for the emp in that page are fetched with him/her and rendered,
        there should be an option for each question to update its grade (knowing the id).

        Update the grade of a specific interview question.
        Only the HR assigned to this employee can perform this.
        """
        employee = self.get_object()

        if employee.interview_state == 'done' or employee.interview_state == 'accepted':
            return Response({"detail": "Interview is already completed. You cannot modify it."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can perform this action."}, status=status.HTTP_403_FORBIDDEN)

        if employee.interviewer != hr:
            return Response({"detail": "You are not the assigned interviewer."}, status=status.HTTP_403_FORBIDDEN)

        question_id = request.data.get("question_id")
        grade = request.data.get("grade")

        if not (0 <= grade <= 100):
            return Response({"detail": "Grade must be between 0 and 100."}, status=status.HTTP_400_BAD_REQUEST)



        if question_id is None or grade is None:
            return Response({"detail": "Missing 'question_id' or 'grade'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            question = InterviewQuestion.objects.get(id=question_id, employee=employee)
        except InterviewQuestion.DoesNotExist:
            return Response({"detail": "Question not found for this employee."}, status=status.HTTP_404_NOT_FOUND)

        try:
            grade = float(grade)
        except ValueError:
            return Response({"detail": "Grade must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        question.grade = grade
        question.save()
        recalculate_interview_avg_grade(employee)

        return Response({"detail": "Question grade updated successfully."})
    
    @action(detail=True, methods=['patch'], url_path='rate-interviewee')
    def rate_interviewee(self, request, pk=None):
        """
        Allows the assigned HR interviewer to rate the interviewee.
        """
        employee = self.get_object()

        if employee.interview_state == 'done' or employee.interview_state == 'accepted':
            return Response({"detail": "Interview is already completed. You cannot modify it."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can rate interviewees."}, status=status.HTTP_403_FORBIDDEN)

        if employee.interviewer != hr:
            return Response({"detail": "You are not the assigned interviewer for this employee."}, status=status.HTTP_403_FORBIDDEN)

        rating = request.data.get("rating")

        if rating is None:
            return Response({"detail": "Missing 'rating' value."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = float(rating)
        except ValueError:
            return Response({"detail": "Rating must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

        if not (0 <= rating <= 100):
            return Response({"detail": "Rating must be between 0 and 100."}, status=status.HTTP_400_BAD_REQUEST)

        employee.interviewer_rating = rating
        employee.save(update_fields=['interviewer_rating'])

        return Response({"detail": "Interviewee rated successfully."}, status=status.HTTP_200_OK)
        


    @action(detail=True, methods=['patch'], url_path='submit-interview')
    def submit_interview(self, request, pk=None):
        """
        Marks the interview as 'done'. Only the assigned HR can do this.
        The only highlighted button in the page
        """
        employee = self.get_object()

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can perform this action."}, status=status.HTTP_403_FORBIDDEN)

        if employee.interviewer != hr:
            return Response({"detail": "You are not the assigned interviewer."}, status=status.HTTP_403_FORBIDDEN)

        if employee.interview_state == 'done' or employee.interview_state == 'accepted':
            return Response({"detail": "Interview is already submitted."}, status=status.HTTP_400_BAD_REQUEST)

        employee.interview_state = 'done'
        employee.save(update_fields=["interview_state"])

        return Response({"detail": "Interview submitted successfully."})



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

class HRAcceptEmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeDataSerializer
    permission_classes = [IsAuthenticated, IsHR]
    http_method_names = ['patch']

    def partial_update(self, request, *args, **kwargs):
        employee = self.get_object()

        try:
            hr = HR.objects.get(user=request.user)
        except HR.DoesNotExist:
            return Response({"detail": "Only HRs can perform this action."}, status=status.HTTP_403_FORBIDDEN)

        if employee.interviewer != hr:
            return Response({"detail": "You are not the assigned interviewer for this employee."}, status=status.HTTP_403_FORBIDDEN)

        if employee.interview_state != 'done':
            return Response({"detail": f"Cannot accept employee with current interview status: '{employee.interview_state}'."},
                            status=status.HTTP_400_BAD_REQUEST)

        return super().partial_update(request, *args, **kwargs)

class SubmitTaskView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    #permission_classes = [IsAuthenticated, IsEmployee]

    def post(self, request, *args, **kwargs):
        task_id = request.data.get("task_id")
        task = get_object_or_404(Task, id=task_id)

        if task.assigned_to.user != request.user:
            return Response({'detail': 'You are not authorized to submit this task.'}, status=403)

        if task.is_submitted:
            return Response({'detail': 'Task already submitted.'}, status=400)

        # upload files
        files = request.FILES.getlist("file")
        if not files:
            return Response({'detail': 'No files uploaded.'}, status=400)

        for f in files:
            File.objects.create(task=task, file=f)

        # update task status
        task.is_submitted = True
        task.submission_time = timezone.now()
        task.save()

        return Response({
            'message': 'Task submitted successfully.',
            'task': TaskSerializer(task).data
        }, status=200)


class TaskViewSet(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        task = get_object_or_404(Task, pk=pk)
        if task.created_by.user != request.user:
            return Response({"error": "You are not authorized to accept this task."}, status=403)
        if task.is_accepted:
            return Response({"error": "Task already accepted."}, status=400)
        if task.is_refused:
            return Response({"error": "Task has already been refused."}, status=400)
        if not task.submission_time:
            return Response({"error": "Task has not been submitted yet."}, status=400)

        time_remaining = (task.deadline - task.submission_time).total_seconds() / 3600
        task.is_accepted = True
        task.rating = request.data.get("rating")  # assuming rating is passed
        task.time_remaining_before_deadline_when_accepted = time_remaining
        task.save()

        return Response({
            "message": "Task accepted successfully.",
            "remaining_time_in_hours": round(time_remaining, 2),
            "task": TaskSerializer(task).data
        })

    @action(detail=True, methods=['post'])
    def refuse(self, request, pk=None):
        task = get_object_or_404(Task, pk=pk)
        if task.created_by.user != request.user:
            return Response({"error": "You are not authorized to refuse this task."}, status=403)
        if task.is_refused:
            return Response({"error": "Task already refused."}, status=400)
        if task.is_accepted:
            return Response({"error": "Task has already been accepted."}, status=400)
        if not task.submission_time:
            return Response({"error": "Task has not been submitted yet."}, status=400)

        reason = request.data.get("reason")
        if not reason:
            return Response({"error": "Reason is required for refusing the task."}, status=400)

        task.is_refused = True
        task.refuse_reason = reason
        task.save()

        return Response({
            "message": "Task refused successfully.",
            "refuse_reason": reason,
            "task": TaskSerializer(task).data
        })