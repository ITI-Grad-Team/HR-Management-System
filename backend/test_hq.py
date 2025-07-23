import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
django.setup()

from api.models import Headquarters

# Test headquarters model
hq = Headquarters.get_headquarters()
print(f"Headquarters: {hq.name}")
print(f"Location: {hq.latitude}, {hq.longitude}")
print(f"Radius: {hq.allowed_radius_meters}m")
print(f"ID: {hq.id}")
