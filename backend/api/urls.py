from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import HRViewEmployeesViewSet,AdminViewHRsViewSet,AdminViewEmployeesViewSet,HRManageApplicationLinksViewSet,HRManageSkillsViewSet,HRManagePositionsViewSet,AdminInviteHRViewSet,EmployeeTaskViewSet,SubmitTaskView ,TaskViewSet

from .views import PublicApplicantsViewSet,HRViewEmployeesViewSet,AdminViewHRsViewSet,AdminViewEmployeesViewSet,HRManageApplicationLinksViewSet,HRManageSkillsViewSet,HRManagePositionsViewSet,AdminInviteHRViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import EmployeeDataViewSet

router = DefaultRouter()

# Public
router.register(r'apply', PublicApplicantsViewSet, basename='public-apply')


# HR views
router.register(r'hr/employees', HRViewEmployeesViewSet, basename='hr-employees')
router.register(r'hr/application-links', HRManageApplicationLinksViewSet, basename='hr-application-links')
router.register(r'hr/skills', HRManageSkillsViewSet, basename='hr-manage-skills')
router.register(r'hr/positions', HRManagePositionsViewSet, basename='hr-manage-positions')
# router.register(r'hr/employees-data', EmployeeDataViewSet, basename='hr-employees-data')

# Admin views
router.register(r'admin/hrs', AdminViewHRsViewSet, basename='admin-hrs')
router.register(r'admin/employees', AdminViewEmployeesViewSet, basename='admin-employees')
router.register(r'admin/invite-hr', AdminInviteHRViewSet, basename='admin-invite-hr')

#tasks
router.register(r'tasks', TaskViewSet, basename='tasks')


urlpatterns = [
    path('', include(router.urls)),  
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('submit-task/', SubmitTaskView.as_view(), name='submit-task'),


]
