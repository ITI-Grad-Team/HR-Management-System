from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from sqlalchemy import Cast
from .models import CasualLeave, EmployeeLeavePolicy, Employee
from .serializers import CasualLeaveSerializer, EmployeeLeavePolicySerializer
from .permissions import IsEmployee, IsHRorAdmin
from django.db.models import Sum
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, F
from django.db.models.functions import Extract


class CasualLeavePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class CasualLeaveViewSet(viewsets.ModelViewSet):
    serializer_class = CasualLeaveSerializer
    pagination_class = CasualLeavePagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "employee__user__username"]
    search_fields = ["employee__user__username", "employee__user__email", "reason"]
    ordering_fields = [
        "created_at",
        "start_date",
        "end_date",
        "status",
        "duration",
    ]  # Added duration
    ordering = ["-created_at"]  # Default ordering

    def get_serializer_class(self):
        """
        OPTIMIZED: Use lightweight serializer for list operations
        """
        if self.action == "list":
            from .serializers import CasualLeaveListSerializer

            return CasualLeaveListSerializer
        return CasualLeaveSerializer

    def get_permissions(self):
        if self.action in ["create", "my_requests", "my_leave_balance"]:
            self.permission_classes = [IsAuthenticated, IsEmployee]
        else:
            self.permission_classes = [IsAuthenticated, IsHRorAdmin]
        return super().get_permissions()

    def get_queryset(self):
        """
        OPTIMIZED: Highly optimized queryset with minimal joins and strategic indexing
        """
        user = self.request.user

        # Base queryset with ONLY necessary joins
        base_queryset = CasualLeave.objects.select_related(
            "employee__user__basicinfo",  # Streamlined - only need basic info
            "employee__position",  # For position name
            "reviewed_by",  # For reviewer info
        ).only(
            # Only fetch needed fields to reduce data transfer
            "id",
            "start_date",
            "end_date",
            "duration",
            "status",
            "created_at",
            "reason",
            "rejection_reason",
            "employee__user__basicinfo__username",
            "employee__position__name",
            "reviewed_by__username",
        )

        # Filter early if employee to reduce dataset
        if hasattr(user, "basicinfo") and user.basicinfo.role == "employee":
            return base_queryset.filter(employee__user=user)

        return base_queryset

    def perform_create(self, serializer):
        try:
            employee = self.request.user.employee
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee record not found for this user")

        # Validation logic
        start_date = serializer.validated_data["start_date"]
        end_date = serializer.validated_data["end_date"]
        duration = (end_date - start_date).days + 1

        policy, created = EmployeeLeavePolicy.objects.get_or_create(employee=employee)

        if duration > policy.max_days_per_request:
            raise serializers.ValidationError(
                f"Request exceeds the maximum of {policy.max_days_per_request} days per request."
            )

        # OPTIMIZED: Use Sum on duration field instead of loop
        approved_days = (
            CasualLeave.objects.filter(employee=employee, status="approved").aggregate(
                total_days=Sum("duration")
            )["total_days"]
            or 0
        )

        if (approved_days + duration) > policy.yearly_quota:
            raise serializers.ValidationError(
                "Request exceeds your remaining leave quota."
            )

        serializer.save(employee=employee)

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status == "approved":
            return Response(
                {"detail": "Leave is already approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        if leave.status == "rejected":
            return Response(
                {"detail": "Leave is already rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        leave.status = "rejected"
        leave.rejection_reason = rejection_reason
        leave.reviewed_by = request.user
        leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=False, methods=["get"], url_path="my-requests")
    def my_requests(self, request):
        """
        OPTIMIZED: Get current user's leave requests with optimized query
        """
        try:
            employee = request.user.employee
        except Employee.DoesNotExist:
            return Response(
                {"error": "Employee record not found for this user"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # OPTIMIZED: Use minimal fields for employee view
        leaves = (
            CasualLeave.objects.filter(employee=employee)
            .only(
                "id",
                "start_date",
                "end_date",
                "duration",
                "status",
                "created_at",
                "reason",
                "rejection_reason",
            )
            .order_by("-created_at")
        )

        page = self.paginate_queryset(leaves)
        if page is not None:
            # Use a minimal serializer for employee's own requests
            serializer_data = []
            for leave in page:
                serializer_data.append(
                    {
                        "id": leave.id,
                        "start_date": leave.start_date,
                        "end_date": leave.end_date,
                        "duration": leave.duration,
                        "status": leave.status,
                        "created_at": leave.created_at,
                        "reason": leave.reason or "",
                        "rejection_reason": leave.rejection_reason or "",
                    }
                )
            return self.get_paginated_response(serializer_data)

        serializer = self.get_serializer(leaves, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my-leave-balance")
    def my_leave_balance(self, request):
        """
        OPTIMIZED: Get current user's leave balance using duration field
        """
        try:
            employee = request.user.employee
        except Employee.DoesNotExist:
            return Response(
                {"error": "Employee record not found for this user"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        policy, _ = EmployeeLeavePolicy.objects.get_or_create(employee=employee)

        # OPTIMIZED: Use Sum on duration field - MUCH FASTER!
        approved_days = (
            CasualLeave.objects.filter(employee=employee, status="approved").aggregate(
                total_days=Sum("duration")
            )["total_days"]
            or 0
        )

        remaining_days = max(0, policy.yearly_quota - approved_days)

        return Response(
            {
                "yearly_quota": policy.yearly_quota,
                "approved_days": approved_days,
                "remaining_days": remaining_days,
            }
        )
