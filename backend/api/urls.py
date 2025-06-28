from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HRViewEmployeesViewSet,AdminViewHRsViewSet,AdminViewEmployeesViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView



router = DefaultRouter()

# HR views
router.register(r'hr/employees', HRViewEmployeesViewSet, basename='hr-employees')


# Admin views
router.register(r'admin/hrs', AdminViewHRsViewSet, basename='admin-hrs')
router.register(r'admin/employees', AdminViewEmployeesViewSet, basename='admin-employees')

urlpatterns = [
    path('', include(router.urls)),  
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
