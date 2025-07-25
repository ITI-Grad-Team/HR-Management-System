# Generated by Django 5.2.3 on 2025-07-22 15:54

from django.db import migrations, models


class Migration(migrations.Migration):
    def calculate_duration(apps, schema_editor):
        CasualLeave = apps.get_model("api", "CasualLeave")
        for leave in CasualLeave.objects.all():
            leave.duration = (leave.end_date - leave.start_date).days + 1
            leave.save()

    dependencies = [
        ("api", "0031_casualleave_duration"),
    ]

    operations = [
        migrations.RunPython(calculate_duration),
        migrations.AlterField(
            model_name="casualleave",
            name="duration",
            field=models.PositiveIntegerField(editable=False),  # Now non-nullable
        ),
    ]
