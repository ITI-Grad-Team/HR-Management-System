# Generated by Django 5.2.3 on 2025-07-23 14:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0037_employee_is_deleted_hr_is_deleted'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='position_rank',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
