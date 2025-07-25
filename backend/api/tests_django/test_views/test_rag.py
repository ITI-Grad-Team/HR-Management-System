# tests/test_rag.py
import pytest
from rest_framework import status
from django.urls import reverse

@pytest.mark.django_db
class TestRAGViewSet:
    def test_query_as_employee(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        url = reverse('rag-handle-query')  # Correct URL name
        data = {'question': 'What are the company policies?'}
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'answer' in response.data
        assert 'regular employee' in response.data['responded_as']

    def test_query_as_hr(self, api_client, hr_user):
        api_client.force_authenticate(user=hr_user)
        url = reverse('rag-handle-query')  # Correct URL name
        data = {'question': 'How to handle employee onboarding?'}
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'answer' in response.data
        assert 'HR representative' in response.data['responded_as']