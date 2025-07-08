from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import OvertimeRequest
from .serializers import (
    OvertimeRequestSerializer,
    OvertimeRequestCreateSerializer,
    OvertimeRequestApprovalSerializer,
)
from .permissions import OvertimeRequestPermission


class OvertimeRequestViewSet(viewsets.ModelViewSet):
    queryset = OvertimeRequest.objects.all()
    serializer_class = OvertimeRequestSerializer
    permission_classes = [IsAuthenticated, OvertimeRequestPermission]

    def get_queryset(self):
        user = self.request.user
        role = user.basicinfo.role.lower()

        # Admin and HR can see all requests
        if role in ["admin", "hr"]:
            return OvertimeRequest.objects.all()

        # Coordinators can see requests for their position employees
        elif hasattr(user, "employee") and user.employee.is_coordinator:
            return OvertimeRequest.objects.filter(
                Q(attendance_record__user=user)  # Own requests
                | Q(
                    attendance_record__user__employee__position=user.employee.position
                )  # Team requests
            )

        # Employees can only see their own requests
        else:
            return OvertimeRequest.objects.filter(attendance_record__user=user)

    def get_serializer_class(self):
        if self.action == "create":
            return OvertimeRequestCreateSerializer
        elif self.action in ["approve", "reject"]:
            return OvertimeRequestApprovalSerializer
        return OvertimeRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        overtime_request = serializer.save()

        # Return full serializer data
        response_serializer = OvertimeRequestSerializer(overtime_request)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get all pending overtime requests (HR/Admin only)"""
        pending_requests = self.get_queryset().filter(status="pending")
        serializer = self.get_serializer(pending_requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        """Approve an overtime request (HR/Admin only)"""
        overtime_request = self.get_object()

        if overtime_request.status != "pending":
            return Response(
                {"detail": "Only pending requests can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            overtime_request, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)

        # Update overtime request
        overtime_request.status = "approved"
        overtime_request.reviewed_at = timezone.now()
        overtime_request.reviewed_by = request.user
        if "hr_comment" in serializer.validated_data:
            overtime_request.hr_comment = serializer.validated_data["hr_comment"]
        overtime_request.save()

        # Update associated attendance record
        attendance_record = overtime_request.attendance_record
        attendance_record.overtime_hours = overtime_request.requested_hours
        attendance_record.overtime_approved = True
        attendance_record.save()

        response_serializer = OvertimeRequestSerializer(overtime_request)
        return Response(response_serializer.data)

    @action(detail=True, methods=["patch"])
    def reject(self, request, pk=None):
        """Reject an overtime request (HR/Admin only)"""
        overtime_request = self.get_object()

        if overtime_request.status != "pending":
            return Response(
                {"detail": "Only pending requests can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            overtime_request, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)

        # Update overtime request
        overtime_request.status = "rejected"
        overtime_request.reviewed_at = timezone.now()
        overtime_request.reviewed_by = request.user
        if "hr_comment" in serializer.validated_data:
            overtime_request.hr_comment = serializer.validated_data["hr_comment"]
        overtime_request.save()

        # Ensure attendance record has no overtime
        attendance_record = overtime_request.attendance_record
        attendance_record.overtime_hours = 0
        attendance_record.overtime_approved = False
        attendance_record.save()

        response_serializer = OvertimeRequestSerializer(overtime_request)
        return Response(response_serializer.data)
