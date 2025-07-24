import pytest
from datetime import time, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.models import HR, Employee, Position, ApplicationLink, Region, EducationDegree, EducationField

@pytest.mark.django_db
class TestHRModel:
    @pytest.fixture(autouse=True)
    def setup(self, hr, position, application_link, region, education_degree, education_field):
        self.hr = hr
        self.position = position
        self.application_link = application_link
        self.region = region
        self.education_degree = education_degree
        self.education_field = education_field
        self.User = get_user_model()

    def create_employee(self, user, interview_state, **kwargs):
        """Helper method to create employee records"""
        return Employee.objects.create(
            user=user,
            phone='+123456789',
            position=self.position,
            is_coordinator=False,
            application_link=self.application_link,
            region=self.region,
            highest_education_degree=self.education_degree,
            highest_education_field=self.education_field,
            interviewer=self.hr,
            interview_state=interview_state,
            basic_salary=5000,
            expected_attend_time=time(9, 0),
            **kwargs
        )

    def test_accepted_employees_property(self):
        """Test accepted_employees returns only accepted employees"""
        # Create test users
        user1 = self.User.objects.create_user(username='testuser1')
        user2 = self.User.objects.create_user(username='testuser2')
        
        # Create test employees
        accepted_emp = self.create_employee(user1, 'accepted')
        rejected_emp = self.create_employee(user2, 'rejected')
        
        # Verify only accepted employees are returned
        assert self.hr.accepted_employees.count() == 1
        assert self.hr.accepted_employees.first() == accepted_emp
        
        # Clean up
        accepted_emp.delete()
        rejected_emp.delete()
        user1.delete()
        user2.delete()

    def test_calculate_stats_with_no_employees(self):
        """Test stats calculation with no accepted employees"""
        self.hr.calculate_accepted_employees_stats()
        self.hr.refresh_from_db()
        
        assert self.hr.accepted_employees_avg_task_rating is None
        assert self.hr.accepted_employees_count == 0

    def test_calculate_stats_with_employees(self):
        """Test HR stats calculation with one employee"""
        user = self.User.objects.create_user(username='testuser3')
        employee = self.create_employee(user, 'accepted',
            total_task_ratings=20,
            number_of_accepted_tasks=5,
            total_time_remaining_before_deadline=10,
            total_lateness_hours=2,
            total_absent_days=1,
            total_overtime_hours=5,
            number_of_non_holiday_days_since_join=10,
            interviewer_rating=4.5
        )
        
        self.hr.calculate_accepted_employees_stats()
        self.hr.refresh_from_db()
        
        assert self.hr.accepted_employees_avg_task_rating == 4.0
        assert self.hr.accepted_employees_avg_time_remaining == 2.0
        assert self.hr.accepted_employees_avg_lateness_hrs == 0.2
        assert self.hr.accepted_employees_avg_absence_days == 0.1
        assert self.hr.accepted_employees_avg_overtime == 0.5
        assert self.hr.accepted_employees_avg_interviewer_rating == 4.5
        
        employee.delete()
        user.delete()

    def test_calculate_stats_correlations(self, employee_factory):
        """Test correlation calculations with multiple employees"""
        # Create 3 employees with varying ratings
        employees = [
            employee_factory(
                interviewer=self.hr,
                interview_state='accepted',
                total_task_ratings=30,
                number_of_accepted_tasks=10,
                total_time_remaining_before_deadline=20,
                total_lateness_hours=5,
                total_absent_days=2,
                total_overtime_hours=8,
                number_of_non_holiday_days_since_join=20,
                interviewer_rating=3.0
            ),
            employee_factory(
                interviewer=self.hr,
                interview_state='accepted',
                total_task_ratings=40,
                number_of_accepted_tasks=10,
                total_time_remaining_before_deadline=30,
                total_lateness_hours=3,
                total_absent_days=1,
                total_overtime_hours=5,
                number_of_non_holiday_days_since_join=20,
                interviewer_rating=4.0
            ),
            employee_factory(
                interviewer=self.hr,
                interview_state='accepted',
                total_task_ratings=50,
                number_of_accepted_tasks=10,
                total_time_remaining_before_deadline=40,
                total_lateness_hours=1,
                total_absent_days=0,
                total_overtime_hours=2,
                number_of_non_holiday_days_since_join=20,
                interviewer_rating=5.0
            )
        ]
        
        self.hr.calculate_accepted_employees_stats()
        self.hr.refresh_from_db()
        
        # Verify correlations
        assert self.hr.interviewer_rating_to_lateness_hrs_correlation < 0
        assert self.hr.interviewer_rating_to_absence_days_correlation < 0
        assert self.hr.interviewer_rating_to_task_rating_correlation > 0
        
        # Clean up
        for emp in employees:
            emp.delete()