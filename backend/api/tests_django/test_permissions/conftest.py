# tests_django/test_permissions/conftest.py
import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from api.models import BasicInfo, Employee, Position, ApplicationLink, HR

User = get_user_model()

@pytest.fixture
def factory():
    from rest_framework.test import APIRequestFactory
    return APIRequestFactory()

@pytest.fixture
def position(db):
    return Position.objects.create(name='Test Position')

@pytest.fixture
def application_link(db, position):
    return ApplicationLink.objects.create(
        url='http://example.com',
        distinction_name='dev_link',
        position=position,
        is_coordinator=False,
        number_remaining_applicants_to_limit=5
    )

@pytest.fixture
def hr_user(db):
    user = User.objects.create_user(username='hr_user')
    BasicInfo.objects.create(user=user, role='hr')
    HR.objects.create(user=user)
    return user

@pytest.fixture
def employee_user(db, position, application_link):
    user = User.objects.create_user(username='employee_user')
    BasicInfo.objects.create(user=user, role='employee')
    Employee.objects.create(
        user=user,
        position=position,
        application_link=application_link,
        interview_state='accepted',
        is_coordinator=False,
        phone='+123456789',
        basic_salary=5000
    )
    return user

@pytest.fixture
def coordinator_user(db, employee_user):
    # Update existing employee to be coordinator
    employee = Employee.objects.get(user=employee_user)
    employee.is_coordinator = True
    employee.save()
    employee.refresh_from_db()
    employee_user.refresh_from_db()
    return employee_user

@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(username='admin_user')
    BasicInfo.objects.create(user=user, role='admin')
    return user

@pytest.fixture
def no_role_user(db):
    return User.objects.create_user(username='no_role_user')

@pytest.fixture
def anonymous_user():
    return AnonymousUser()

@pytest.fixture
def view_with_action():
    def _view_with_action(action=None):
        return type('View', (), {'action': action})
    return _view_with_action