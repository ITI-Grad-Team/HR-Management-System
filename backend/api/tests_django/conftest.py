import pytest
from datetime import time
from django.contrib.auth import get_user_model
from api.models import (
    HR, Employee, Position, Region,
    EducationDegree, EducationField, ApplicationLink, Skill
)

@pytest.fixture
def user():
    return get_user_model().objects.create_user(
        username='testuser',
        password='testpass123',
        email='test@example.com'
    )

@pytest.fixture
def user_factory(db):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    count = 0
    
    def create_user(**kwargs):
        nonlocal count
        count += 1
        defaults = {
            'username': f'testuser{count}',
            'password': 'testpass123',
            'email': f'testuser{count}@example.com'
        }
        defaults.update(kwargs)
        return User.objects.create_user(**defaults)
    return create_user

@pytest.fixture
def position():
    return Position.objects.create(name='Software Developer')

@pytest.fixture
def region():
    return Region.objects.create(
        name='Cairo',
        distance_to_work=10,
        latitude=30.0444,
        longitude=31.2357,
        allowed_radius_meters=150
    )

@pytest.fixture
def education_degree():
    return EducationDegree.objects.create(name='Bachelor')

@pytest.fixture
def education_field():
    return EducationField.objects.create(name='Computer Science')

@pytest.fixture
def skill():
    return Skill.objects.create(name='Python')

@pytest.fixture
def application_link(position, skill):
    link = ApplicationLink.objects.create(
        url='http://example.com',
        distinction_name='dev_link',
        position=position,
        is_coordinator=False,
        number_remaining_applicants_to_limit=5
    )
    link.skills.add(skill)
    return link

@pytest.fixture
def hr(user):
    return HR.objects.create(user=user)

@pytest.fixture
def employee(user, position, hr, region, education_degree, education_field, application_link):
    return Employee.objects.create(
        user=user,
        phone='+123456789',
        position=position,
        is_coordinator=False,
        application_link=application_link,
        region=region,
        highest_education_degree=education_degree,
        highest_education_field=education_field,
        interviewer=hr,
        interview_state='accepted',
        basic_salary=5000,
        expected_attend_time=time(9, 0)
    )

@pytest.fixture
def employee_factory(db, user_factory, position, hr, region, education_degree, education_field, application_link):
    def create_employee(**kwargs):
        defaults = {
            'user': user_factory(),
            'phone': '+123456789',
            'position': position,
            'is_coordinator': False,
            'application_link': application_link,
            'region': region,
            'highest_education_degree': education_degree,
            'highest_education_field': education_field,
            'interviewer': hr,
            'interview_state': 'accepted',
            'basic_salary': 5000,
            'expected_attend_time': time(9, 0)
        }
        defaults.update(kwargs)
        return Employee.objects.create(**defaults)
    return create_employee