# tests/conftest.py
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from api.models import (
    BasicInfo, HR, Employee, ApplicationLink, Skill, Position,
    Region, EducationDegree, EducationField, InterviewQuestion,
    Task, File, CompanyStatistics, SalaryRecord, Headquarters
)

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username='admin@example.com',
        password='adminpass',
        is_staff=True,
        is_superuser=True
    )
    BasicInfo.objects.create(user=user, role='admin', username='admin')
    return user

@pytest.fixture
def hr_user(db):
    user = User.objects.create_user(
        username='hr@example.com',
        password='hrpass'
    )
    BasicInfo.objects.create(user=user, role='hr', username='hr_user')
    hr = HR.objects.create(user=user)
    return user

@pytest.fixture
def position(db):
    return Position.objects.create(name='Software Engineer')

@pytest.fixture
def region(db):
    return Region.objects.create(name='Remote', distance_to_work=0)

@pytest.fixture
def skill(db):
    return Skill.objects.create(name='Python')

@pytest.fixture
def application_link(db, position, skill):
    link = ApplicationLink.objects.create(
        distinction_name='dev-2024',
        position=position,
        is_coordinator=False
    )
    link.skills.add(skill)
    return link

@pytest.fixture
def employee_user(db, position, region, application_link):
    user = User.objects.create_user(
        username='employee@example.com',
        password='emppass'
    )
    BasicInfo.objects.create(user=user, role='employee', username='employee_user')
    employee = Employee.objects.create(
        user=user,
        position=position,
        region=region,
        application_link=application_link,  # Added this required field
        interview_state='accepted',
        is_coordinator=False
    )
    return user

@pytest.fixture
def coordinator_user(db, position, region, application_link):
    user = User.objects.create_user(
        username='coordinator@example.com',
        password='coordpass'
    )
    BasicInfo.objects.create(user=user, role='employee', username='coordinator')
    employee = Employee.objects.create(
        user=user,
        position=position,
        region=region,
        application_link=application_link,  # Added this required field
        interview_state='accepted',
        is_coordinator=True
    )
    return user