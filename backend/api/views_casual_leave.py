from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .models import CasualLeave, EmployeeLeavePolicy, Employee
from .serializers import CasualLeaveSerializer, EmployeeLeavePolicySerializer
from .permissions import IsEmployee, IsHRorAdmin
from django.db.models import Sum


class CasualLeaveViewSet(viewsets.ModelViewSet):
    queryset = CasualLeave.objects.all()
    serializer_class = CasualLeaveSerializer

    def get_permissions(self):
        if self.action in ["create", "my_requests", "my_leave_balance"]:
            self.permission_classes = [IsAuthenticated, IsEmployee]
        else:
            self.permission_classes = [IsAuthenticated, IsHRorAdmin]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.basicinfo.role == "employee":
            return CasualLeave.objects.filter(employee__user=user)
        return CasualLeave.objects.all()

    def perform_create(self, serializer):
        employee = self.request.user.employee
        
        # Validation logic
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        duration = (end_date - start_date).days + 1
        
        policy, created = EmployeeLeavePolicy.objects.get_or_create(employee=employee)
        
        if duration > policy.max_days_per_request:
            raise serializers.ValidationError(f"Request exceeds the maximum of {policy.max_days_per_request} days per request.")
            
        approved_leaves = CasualLeave.objects.filter(employee=employee, status='approved')
        
        approved_days = 0
        for leave in approved_leaves:
            approved_days += leave.duration
        
        if (approved_days + duration) > policy.yearly_quota:
            raise serializers.ValidationError("Request exceeds your remaining leave quota.")

        serializer.save(employee=employee)

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = "approved"
        leave.reviewed_by = request.user
        leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["patch"])
    def reject(self, request, pk=None):
        leave = self.get_object()
        rejection_reason = request.data.get("rejection_reason")
        if not rejection_reason:
            return Response(
                {"detail": "Rejection reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        leave.status = "rejected"
        leave.rejection_reason = rejection_reason
        leave.reviewed_by = request.user
        leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=False, methods=["get"], url_path="my-requests")
    def my_requests(self, request):
        leaves = self.get_queryset()
        return Response(self.get_serializer(leaves, many=True).data)

    @action(detail=False, methods=["get"], url_path="my-leave-balance")
    def my_leave_balance(self, request):
        employee = request.user.employee
        policy, created = EmployeeLeavePolicy.objects.get_or_create(employee=employee)

        approved_leaves = CasualLeave.objects.filter(
            employee=employee, status="approved"
        )
        approved_days = 0
        for leave in approved_leaves:
            approved_days += (leave.end_date - leave.start_date).days + 1
        remaining_days = policy.yearly_quota - approved_days
        return Response(
            {
                "yearly_quota": policy.yearly_quota,
                "approved_days": approved_days,
                "remaining_days": remaining_days,
            }
        )
