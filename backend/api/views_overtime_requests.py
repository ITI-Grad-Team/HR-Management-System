from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import OvertimeRequest
from .utils.queryset_utils import get_role_based_queryset
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
        return get_role_based_queryset(self.request.user, OvertimeRequest)

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
        """Get all pending overtime requests (HR/Admin only) - OPTIMIZED"""
        pending_requests = (
            self.get_queryset()
            .filter(status="pending")
            .select_related("attendance_record__user")
            .only(
                "id",
                "requested_hours",
                "status",
                "hr_comment",
                "requested_at",
                "reviewed_at",
                "attendance_record__date",
                "attendance_record__check_out_time",
                "attendance_record__user__username",
            )
        )
        serializer = self.get_serializer(pending_requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Get recent approved/rejected requests (HR/Admin only) - OPTIMIZED"""
        recent_requests = (
            self.get_queryset()
            .filter(
                Q(status="approved") | Q(status="rejected"),
                reviewed_at__gte=timezone.now() - timezone.timedelta(days=1),
            )
            .select_related("attendance_record__user", "reviewed_by")
            .order_by("-reviewed_at")
            .only(
                "id",
                "requested_hours",
                "status",
                "hr_comment",
                "requested_at",
                "reviewed_at",
                "attendance_record__date",
                "attendance_record__check_out_time",
                "attendance_record__user__username",
                "reviewed_by__username",
            )
        )
        serializer = self.get_serializer(recent_requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def revert_to_pending(self, request, pk=None):
        """Revert an approved/rejected request back to pending."""
        overtime_request = self.get_object()

        if overtime_request.status not in ["approved", "rejected"]:
            return Response(
                {"detail": "Only approved or rejected requests can be reverted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Store old state
        was_approved = overtime_request.status == "approved"

        # Revert request
        overtime_request.status = "pending"
        overtime_request.reviewed_at = None
        overtime_request.reviewed_by = None
        overtime_request.hr_comment = ""
        overtime_request.save()

        # Revert attendance record if it was approved
        if was_approved:
            attendance_record = overtime_request.attendance_record
            employee = attendance_record.user.employee

            employee.total_overtime_hours -= attendance_record.overtime_hours
            employee.save(update_fields=["total_overtime_hours"])

            attendance_record.overtime_hours = 0
            attendance_record.overtime_approved = False
            attendance_record.save()

        return Response({"detail": "Request reverted to pending."})

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

        # Calculate automatic overtime hours based on checkout vs expected leave time
        from datetime import datetime

        automatic_hours = 0.0
        if (
            attendance_record.check_out_time
            and attendance_record.user.employee.expected_leave_time
        ):
            check_out_dt = datetime.combine(
                attendance_record.date, attendance_record.check_out_time
            )
            expected_leave_dt = datetime.combine(
                attendance_record.date,
                attendance_record.user.employee.expected_leave_time,
            )

            if check_out_dt > expected_leave_dt:
                overtime_delta = check_out_dt - expected_leave_dt
                automatic_hours = round(overtime_delta.total_seconds() / 3600, 2)

        # Use the smaller value between requested and automatic calculation
        final_overtime_hours = min(overtime_request.requested_hours, automatic_hours)

        attendance_record.overtime_hours = final_overtime_hours
        attendance_record.overtime_approved = True
        attendance_record.save()

        employee = attendance_record.user.employee
        employee.total_overtime_hours += final_overtime_hours
        employee.save(update_fields=["total_overtime_hours"])

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
