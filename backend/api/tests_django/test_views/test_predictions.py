# tests/test_predictions.py
import pytest
from rest_framework import status
from django.urls import reverse
from api.models import Region, EducationDegree, EducationField

@pytest.mark.django_db
class TestEmployeePredictionViewSet:
    def test_predict_and_update(self, api_client, admin_user, employee_user, region, skill):
        # First set up required fields
        degree = EducationDegree.objects.create(name="Bachelor's")
        field = EducationField.objects.create(name="Computer Science")
        
        employee = employee_user.employee
        employee.region = region
        employee.highest_education_degree = degree
        employee.highest_education_field = field
        employee.years_of_experience = 3
        employee.had_leadership_role = True
        employee.percentage_of_matching_skills = 80
        employee.has_position_related_high_education = True
        employee.skills.add(skill)
        employee.save()

        api_client.force_authenticate(user=admin_user)
        url = reverse('employeeprediction-predict-and-update', kwargs={'pk': employee.id})
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        employee.refresh_from_db()
        assert hasattr(employee, 'predicted_basic_salary')
        assert hasattr(employee, 'predicted_avg_task_rating')

    def test_predict_missing_fields(self, api_client, admin_user, employee_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('employeeprediction-predict-and-update', kwargs={'pk': employee_user.employee.id})
        response = api_client.post(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'missing_fields' in response.data