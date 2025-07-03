from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    HRViewEmployeesViewSet,
    AdminViewHRsViewSet,
    AdminViewEmployeesViewSet,
    HRManageApplicationLinksViewSet,
    HRManageSkillsViewSet,
    HRManagePositionsViewSet,
    AdminInviteHRViewSet,
    TaskViewSet,
)
from .views_attendance import AttendanceViewSet
from .views_salaryrecord import SalaryRecordViewSet

from .views import (
    HRRejectEmployeeViewSet,
    PublicApplicantsViewSet,
    HRViewEmployeesViewSet,
    AdminViewHRsViewSet,
    AdminViewEmployeesViewSet,
    HRManageApplicationLinksViewSet,
    HRManageSkillsViewSet,
    HRManagePositionsViewSet,
    AdminInviteHRViewSet,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import HRAcceptEmployeeViewSet

router = DefaultRouter()

# Public
router.register(r"apply", PublicApplicantsViewSet, basename="public-apply")

# HR views
router.register(r"hr/employees", HRViewEmployeesViewSet, basename="hr-employees")
router.register(
    r"hr/application-links",
    HRManageApplicationLinksViewSet,
    basename="hr-application-links",
)
router.register(r"hr/skills", HRManageSkillsViewSet, basename="hr-manage-skills")
router.register(
    r"hr/positions", HRManagePositionsViewSet, basename="hr-manage-positions"
)
router.register(
    r"hr/accept-employee", HRAcceptEmployeeViewSet, basename="hr-employees-accept"
)
router.register(
    r"hr/reject-employee", HRRejectEmployeeViewSet, basename="hr-reject-employee"
)

# Admin views
router.register(r"admin/hrs", AdminViewHRsViewSet, basename="admin-hrs")
router.register(
    r"admin/employees", AdminViewEmployeesViewSet, basename="admin-employees"
)
router.register(r"admin/invite-hr", AdminInviteHRViewSet, basename="admin-invite-hr")

# tasks
router.register(r"tasks", TaskViewSet, basename="tasks")
router.register(r"attendance", AttendanceViewSet, basename="attendance")
router.register(r"salary/calculate", SalaryRecordViewSet, basename="salary-calculate")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
