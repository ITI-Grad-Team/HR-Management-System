# Generated by Django 5.2.3 on 2025-07-14 13:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0019_companystatistics'),
    ]

    operations = [
        migrations.AddField(
            model_name='hr',
            name='accepted_employees_avg_overtime',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='hr',
            name='accepted_employees_avg_salary',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
