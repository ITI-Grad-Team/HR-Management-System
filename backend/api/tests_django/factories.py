# tests/factories.py
from model_bakery.recipe import Recipe
from django.contrib.auth import get_user_model
from your_app.models import Employee, Position, Region

User = get_user_model()

user_recipe = Recipe(User, username='testuser')

employee_recipe = Recipe(
    Employee,
    user=user_recipe,
    position=Recipe(Position, name='Developer'),
    region=Recipe(Region, name='Cairo'),
    basic_salary=5000
)