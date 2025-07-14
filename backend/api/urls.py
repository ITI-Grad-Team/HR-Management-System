from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AdminViewHRsViewSet,
    AdminInviteHRViewSet,
    AdminPromoteEmployeeViewSet,
    HRViewEmployeesViewSet,
    HRManageApplicationLinksViewSet,
    HRManageSkillsViewSet,
    HRManagePositionsViewSet,
    HRAcceptEmployeeViewSet,
    HRRejectEmployeeViewSet,
    PublicApplicantsViewSet,
    TaskViewSet,
    ViewSelfViewSet,
    CoordinatorViewEmployeesViewSet,
    AdminViewEmployeesViewSet,
    AdminManageSkillsViewSet,
    AdminManagePositionsViewSet,
    AdminViewApplicationLinksViewSet,
    AdminManageRegionsViewSet,
    AdminManageEducationDegreesViewSet,
    AdminManageEducationFieldsViewSet,
    HRManageRegionsViewSet,
    HRManageEducationDegreesViewSet,
    HRManageEducationFieldsViewSet,EmployeePredictionViewSet,AdminStatsViewSet,HRStatsViewSet
)
from .views_attendance import AttendanceViewSet
from .views_salaryrecord import SalaryRecordViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views_overtime_requests import OvertimeRequestViewSet

router = DefaultRouter()

# Public
router.register(r"apply", PublicApplicantsViewSet, basename="public-apply")

# Authenticated
router.register(r"view-self", ViewSelfViewSet, basename="view-self")
router.register(r'employees', EmployeePredictionViewSet, basename='employee')

# Employee
router.register(
    r"coordinator/employees",
    CoordinatorViewEmployeesViewSet,
    basename="coordinator-view-employees",
)


# HR views
router.register(r"hr/employees", HRViewEmployeesViewSet, basename="admin-hr-employees")
router.register(r"hr/skills", HRManageSkillsViewSet, basename="hr-manage-skills")
router.register(
    r"hr/positions", HRManagePositionsViewSet, basename="hr-manage-positions"
)
router.register(r"hr/regions", HRManageRegionsViewSet, basename="hr-regions")
router.register(r"hr/degrees", HRManageEducationDegreesViewSet, basename="hr-degrees")
router.register(r"hr/fields", HRManageEducationFieldsViewSet, basename="hr-fields")

router.register(
    r"hr/application-links",
    HRManageApplicationLinksViewSet,
    basename="hr-application-links",
)
router.register(
    r"hr/accept-employee", HRAcceptEmployeeViewSet, basename="hr-employees-accept"
)
router.register(
    r"hr/reject-employee", HRRejectEmployeeViewSet, basename="hr-reject-employee"
)
router.register(r'hr/statistics', HRStatsViewSet, basename='hr-statistics')




# Admin views
router.register(r"admin/hrs", AdminViewHRsViewSet, basename="admin-hrs")
router.register(
    r"admin/employees", AdminViewEmployeesViewSet, basename="admin-employees"
)
router.register(r"admin/skills", AdminManageSkillsViewSet, basename="admin-skills")
router.register(
    r"admin/positions", AdminManagePositionsViewSet, basename="admin-positions"
)
router.register(r"admin/regions", AdminManageRegionsViewSet, basename="admin-regions")
router.register(r"admin/degrees", AdminManageEducationDegreesViewSet, basename="admin-degrees")
router.register(r"admin/fields", AdminManageEducationFieldsViewSet, basename="admin-fields")

router.register(
    r"admin/application-links",
    AdminViewApplicationLinksViewSet,
    basename="admin-application-links",
)
router.register(r"admin/invite-hr", AdminInviteHRViewSet, basename="admin-invite-hr")
router.register(
    r"admin/promote-employee",
    AdminPromoteEmployeeViewSet,
    basename="admin-promote-employee",
)
router.register(r'admin/company-statistics', AdminStatsViewSet, basename='company-statistics')


# Employee
router.register(r"tasks", TaskViewSet, basename="tasks")

# Attendance & Salary
router.register(r"attendance", AttendanceViewSet, basename="attendance")
router.register(
    r"overtime-requests", OvertimeRequestViewSet, basename="overtime-requests"
)
router.register(r"salary/calculate", SalaryRecordViewSet, basename="salary-calculate")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
