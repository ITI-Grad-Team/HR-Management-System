import pytest
from datetime import date, timedelta
from django.core.exceptions import ValidationError
from api.models import Employee, AttendanceRecord, SalaryRecord

@pytest.mark.django_db
class TestEmployeeModel:
    def test_employee_creation(self, employee):
        """Test basic employee creation"""
        assert employee.user.username == 'testuser'
        assert employee.position.name == 'Software Developer'
        assert employee.interview_state == 'accepted'

    def test_employee_averages(self, employee):
        """Test calculated average properties"""
        employee.total_task_ratings = 45
        employee.number_of_accepted_tasks = 10
        employee.total_time_remaining_before_deadline = 30
        employee.total_lateness_hours = 5
        employee.total_absent_days = 2
        employee.total_overtime_hours = 10
        employee.number_of_non_holiday_days_since_join = 20
        employee.save()
        
        assert employee.avg_task_ratings == 4.5
        assert employee.avg_time_remaining_before_deadline == 3.0
        assert employee.avg_lateness_hours == 0.25
        assert employee.avg_absent_days == 0.1
        assert employee.avg_overtime_hours == 0.5

    def test_employee_with_no_data(self, employee):
        """Test averages with no data (division by zero cases)"""
        assert employee.avg_task_ratings is None
        assert employee.avg_time_remaining_before_deadline is None
        assert employee.avg_lateness_hours is None
        assert employee.avg_absent_days is None
        assert employee.avg_overtime_hours is None

    def test_employee_salary_relationships(self, employee):
        """Test salary record creation and relationship"""
        salary_record = SalaryRecord.objects.create(
            user=employee.user,
            month=6,
            year=2023,
            base_salary=5000,
            final_salary=4800,
            details={
                'absent_days': 2,
                'late_days': 3,
                'overtime_hours': 5
            }
        )
        
        assert employee.user.salaryrecord_set.count() == 1
        assert salary_record.summary['base_salary'] == 5000
        assert salary_record.summary['absent_days'] == 2