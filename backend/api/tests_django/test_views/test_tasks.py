# tests/test_tasks.py
import pytest
from rest_framework import status
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import datetime, timedelta
from api.models import Task, File

@pytest.mark.django_db
class TestTaskViewSet:
    def test_create_task_as_coordinator(self, api_client, coordinator_user, employee_user):
        api_client.force_authenticate(user=coordinator_user)
        url = reverse('task-list')
        deadline = datetime.now() + timedelta(days=7)
        data = {
            'title': 'New Task',
            'description': 'Task description',
            'deadline': deadline.isoformat(),
            'assigned_to': employee_user.employee.id
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Task.objects.count() == 1

    def test_submit_task(self, api_client, employee_user):
        # Create a task first
        task = Task.objects.create(
            created_by=employee_user.employee,
            assigned_to=employee_user.employee,
            title='Test Task',
            description='Test Description',
            deadline=datetime.now() + timedelta(days=1)
        
        api_client.force_authenticate(user=employee_user)
        url = reverse('task-submit', kwargs={'pk': task.id})
        file = SimpleUploadedFile("test.txt", b"file_content")
        response = api_client.post(url, {'files': [file]}, format='multipart')
        assert response.status_code == status.HTTP_200_OK
        task.refresh_from_db()
        assert task.is_submitted
        assert File.objects.count() == 1

    def test_accept_task(self, api_client, coordinator_user, employee_user):
        # Create and submit a task
        task = Task.objects.create(
            created_by=coordinator_user.employee,
            assigned_to=employee_user.employee,
            title='Test Task',
            description='Test Description',
            deadline=datetime.now() + timedelta(days=1),
            is_submitted=True,
            submission_time=datetime.now())
        
        api_client.force_authenticate(user=coordinator_user)
        url = reverse('task-accept', kwargs={'pk': task.id})
        response = api_client.post(url, {'rating': 90}, format='json')
        assert response.status_code == status.HTTP_200_OK
        task.refresh_from_db()
        assert task.is_accepted
        assert task.rating == 90

    def test_my_created_tasks(self, api_client, coordinator_user):
        api_client.force_authenticate(user=coordinator_user)
        url = reverse('task-my-created-tasks')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK