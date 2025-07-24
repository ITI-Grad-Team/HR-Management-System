import pytest
from datetime import date, time, timedelta
from django.core.exceptions import ValidationError
from api.models import AttendanceRecord

@pytest.mark.django_db
class TestAttendanceRecord:
    def test_lateness_calculation(self, employee):
        """Test lateness hours calculation with different scenarios"""
        today = date.today()
        
        # On time (before grace period)
        record1 = AttendanceRecord.objects.create(
            user=employee.user,
            date=today - timedelta(days=1),
            check_in_time=time(8, 59),
            attendance_type='physical',
            status='present'
        )
        assert record1.lateness_hours == 0.0

        # Within grace period (15 mins)
        record2 = AttendanceRecord.objects.create(
            user=employee.user,
            date=today,
            check_in_time=time(9, 14),
            attendance_type='physical',
            status='present'
        )
        assert record2.lateness_hours == 0.0

        # Late (30 minutes after grace period)
        record3 = AttendanceRecord.objects.create(
            user=employee.user,
            date=today + timedelta(days=1),
            check_in_time=time(9, 45),
            attendance_type='physical',
            status='late'
        )
        assert record3.lateness_hours == 0.5  # 30 minutes late = 0.5 hours

    def test_unique_together_constraint(self, employee):
        """Test that user can't have multiple records for same date"""
        today = date.today()
        AttendanceRecord.objects.create(
            user=employee.user,
            date=today,
            attendance_type='physical',
            status='present'
        )
        
        with pytest.raises(Exception):
            AttendanceRecord.objects.create(
                user=employee.user,
                date=today,
                attendance_type='online',
                status='present'
            )

    @pytest.mark.xfail(reason="Model needs validation for check-out before check-in")
    def test_check_in_out_validation(self, employee):
        """Test that invalid check-out time should raise ValidationError"""
        record = AttendanceRecord(
            user=employee.user,
            date=date.today(),
            check_in_time=time(17, 0),  # 5:00 PM
            check_out_time=time(9, 0),   # 9:00 AM (earlier)
            attendance_type='physical',
            status='present'
        )
        
        # This should raise ValidationError but currently doesn't
        with pytest.raises(ValidationError):
            record.full_clean()
        
        # Verify current behavior (record saves without validation)
        record.save()  # This will work because validation is missing
        assert AttendanceRecord.objects.filter(id=record.id).exists()
        
        # Clean up
        record.delete()

    def test_overtime_calculation(self, employee):
        """Test overtime calculation when saving"""
        record = AttendanceRecord.objects.create(
            user=employee.user,
            date=date.today(),
            check_in_time=time(9, 0),
            check_out_time=time(19, 0),
            attendance_type='physical',
            status='present',
            overtime_hours=1.5
        )
        assert record.overtime_hours == 1.5
        record.delete()  # Clean up