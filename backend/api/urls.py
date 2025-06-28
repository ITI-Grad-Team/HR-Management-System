from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HRViewEmployeesViewSet,AdminViewHRsViewSet,AdminViewEmployeesViewSet,HRManageApplicationLinksViewSet,HRManageSkillsViewSet,HRManagePositionsViewSet,AdminInviteHRViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()

# HR views
router.register(r'hr/employees', HRViewEmployeesViewSet, basename='hr-employees')
router.register(r'hr/application-links', HRManageApplicationLinksViewSet, basename='hr-application-links')
router.register(r'hr/skills', HRManageSkillsViewSet, basename='hr-manage-skills')
router.register(r'hr/positions', HRManagePositionsViewSet, basename='hr-manage-positions')



# Admin views
router.register(r'admin/hrs', AdminViewHRsViewSet, basename='admin-hrs')
router.register(r'admin/employees', AdminViewEmployeesViewSet, basename='admin-employees')
router.register(r'admin/invite-hr', AdminInviteHRViewSet, basename='admin-invite-hr')

urlpatterns = [
    path('', include(router.urls)),  
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
