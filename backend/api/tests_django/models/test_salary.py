import pytest
from datetime import datetime
from api.models import SalaryRecord

@pytest.mark.django_db
class TestSalaryRecord:
    def test_salary_record_creation(self, employee):
        """Test basic salary record creation"""
        salary = SalaryRecord.objects.create(
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
        
        assert salary.month == 6
        assert salary.year == 2023
        assert salary.details['absent_days'] == 2

    def test_unique_together_constraint(self, employee):
        """Test user can't have multiple records for same month/year"""
        SalaryRecord.objects.create(
            user=employee.user,
            month=6,
            year=2023,
            base_salary=5000,
            final_salary=4800
        )
        
        with pytest.raises(Exception):
            SalaryRecord.objects.create(
                user=employee.user,
                month=6,
                year=2023,
                base_salary=6000,
                final_salary=5800
            )

    def test_salary_summary_property(self, employee):
        """Test the summary property formatting"""
        salary = SalaryRecord.objects.create(
            user=employee.user,
            month=6,
            year=2023,
            base_salary=5000,
            final_salary=4800,
            details={
                'absent_days': 2,
                'late_days': 3,
                'overtime_hours': 5,
                'bonus': 100,
                'tax': 300
            }
        )
        
        summary = salary.summary
        assert summary['base_salary'] == 5000
        assert summary['absent_days'] == 2
        assert summary['other']['bonus'] == 100
        assert 'tax' in summary['other']