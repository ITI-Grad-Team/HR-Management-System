from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import User, BasicInfo, HR, Employee, ApplicationLink, Skill, InterviewQuestion, OvertimeClaim, Task, File, Position, Report

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
    permission_classes = [IsAuthenticated]

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



class HRGenerateApplicationLinkViewSet(ModelViewSet):
    """
    Allows HR to generate application links
    - Creates unique link with position, skills, role, max applicants
    - Only accessible by HR role
    """
    queryset = ApplicationLink.objects.all()
    serializer_class = ApplicationLinkSerializer
    permission_classes = [IsAuthenticated]

class HRViewEmployeesViewSet(ModelViewSet):
    """
    Displays employee records (hides other HRs)
    - Only accessible by HR role
    - Includes filters and search functionality
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

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
        return Response(status=204)

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