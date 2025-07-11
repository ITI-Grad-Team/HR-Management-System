# Generated by Django 5.2.3 on 2025-06-28 18:41

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ApplicationLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('url', models.URLField()),
                ('distinction_name', models.CharField(max_length=100, unique=True)),
                ('is_coordinator', models.BooleanField()),
                ('number_remaining_applicants_to_limit', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='EducationDegree',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='EducationField',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Position',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Region',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Skill',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='BasicInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('profile_image', models.ImageField(default='profile_images/default.jpg', upload_to='profile_images/')),
                ('phone', models.CharField(blank=True, max_length=15, null=True)),
                ('role', models.CharField(max_length=20)),
                ('username', models.CharField(blank=True, max_length=150)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Employee',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(max_length=15)),
                ('cv', models.FileField(default='cvs/default.pdf', upload_to='cvs/')),
                ('is_coordinator', models.BooleanField()),
                ('years_of_experience', models.IntegerField()),
                ('had_leadership_role', models.BooleanField()),
                ('percentage_of_matching_skills', models.FloatField()),
                ('has_position_related_high_education', models.BooleanField()),
                ('distance_to_work', models.FloatField()),
                ('predicted_avg_task_rating', models.FloatField()),
                ('predicted_avg_time_remaining_before_deadline', models.FloatField()),
                ('predicted_avg_attendance_lateness_hrs', models.FloatField()),
                ('predicted_avg_absence_days', models.FloatField()),
                ('interview_datetime', models.DateTimeField(blank=True, null=True)),
                ('interview_state', models.CharField(default='pending', max_length=50)),
                ('interviewer_rating', models.FloatField(blank=True, null=True)),
                ('interview_questions_avg_grade', models.FloatField(blank=True, null=True)),
                ('join_date', models.DateField(blank=True, null=True)),
                ('basic_salary', models.FloatField(blank=True, null=True)),
                ('overtime_hour_salary', models.FloatField(blank=True, null=True)),
                ('shorttime_hour_penalty', models.FloatField(blank=True, null=True)),
                ('absence_penalty', models.FloatField(blank=True, null=True)),
                ('expected_attend_time', models.TimeField(blank=True, null=True)),
                ('expected_leave_time', models.TimeField(blank=True, null=True)),
                ('overtime_hours', models.FloatField(default=0)),
                ('lateness_hours', models.FloatField(default=0)),
                ('short_time_hours', models.FloatField(default=0)),
                ('number_of_absent_days', models.IntegerField(default=0)),
                ('last_attend_date', models.DateField(blank=True, null=True)),
                ('last_leave_date', models.DateField(blank=True, null=True)),
                ('avg_task_rating', models.FloatField(default=0)),
                ('avg_time_remaining_before_deadline', models.FloatField(default=0)),
                ('avg_attendance_lateness_hrs', models.FloatField(default=0)),
                ('avg_absence_days', models.FloatField(default=0)),
                ('application_link', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.applicationlink')),
                ('highest_education_degree', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.educationdegree')),
                ('highest_education_field', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.educationfield')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='HoliOrOnlineDayWeekday',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('weekday', models.CharField(choices=[('Monday', 'Monday'), ('Tuesday', 'Tuesday'), ('Wednesday', 'Wednesday'), ('Thursday', 'Thursday'), ('Friday', 'Friday'), ('Saturday', 'Saturday'), ('Sunday', 'Sunday')], max_length=10, unique=True)),
                ('employees', models.ManyToManyField(to='api.employee')),
            ],
        ),
        migrations.CreateModel(
            name='HR',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('accepted_employees_avg_task_rating', models.FloatField()),
                ('accepted_employees_avg_time_remaining', models.FloatField()),
                ('accepted_employees_avg_lateness_hrs', models.FloatField()),
                ('accepted_employees_avg_absence_days', models.FloatField()),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='employee',
            name='interviewer',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.hr'),
        ),
        migrations.CreateModel(
            name='InterviewQuestion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
                ('grade', models.FloatField()),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.employee')),
            ],
        ),
        migrations.CreateModel(
            name='OvertimeClaim',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('hours', models.FloatField()),
                ('leave_date', models.DateField()),
                ('is_at_midnight', models.BooleanField(default=False)),
                ('claimer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.employee')),
            ],
        ),
        migrations.AddField(
            model_name='employee',
            name='position',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.position'),
        ),
        migrations.AddField(
            model_name='applicationlink',
            name='position',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.position'),
        ),
        migrations.AddField(
            model_name='employee',
            name='region',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.region'),
        ),
        migrations.CreateModel(
            name='Report',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('basic_salary', models.FloatField()),
                ('overtime_hour_salary', models.FloatField()),
                ('shorttime_hour_penalty', models.FloatField()),
                ('absence_penalty', models.FloatField()),
                ('expected_attend_time', models.TimeField()),
                ('expected_leave_time', models.TimeField()),
                ('overtime_hours', models.FloatField()),
                ('short_time_hours', models.FloatField()),
                ('number_of_absent_days', models.IntegerField()),
                ('total_overtime_penalty', models.FloatField()),
                ('total_shortness_penalty', models.FloatField()),
                ('total_absence_penalty', models.FloatField()),
                ('total', models.FloatField()),
                ('month', models.CharField(max_length=20)),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.employee')),
            ],
        ),
        migrations.AddField(
            model_name='employee',
            name='skills',
            field=models.ManyToManyField(blank=True, to='api.skill'),
        ),
        migrations.AddField(
            model_name='applicationlink',
            name='skills',
            field=models.ManyToManyField(to='api.skill'),
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('deadline', models.DateTimeField()),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('is_submitted', models.BooleanField(default=False)),
                ('submission_time', models.DateTimeField(blank=True, null=True)),
                ('is_refused', models.BooleanField(default=False)),
                ('is_accepted', models.BooleanField(default=False)),
                ('rating', models.FloatField(blank=True, null=True)),
                ('refuse_reason', models.TextField(blank=True)),
                ('time_remaining_before_deadline_when_accepted', models.FloatField(blank=True, null=True)),
                ('assigned_to', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_tasks', to='api.employee')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_tasks', to='api.employee')),
            ],
        ),
        migrations.CreateModel(
            name='File',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='task_files/')),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.task')),
            ],
        ),
        migrations.CreateModel(
            name='HoliOrOnlineDayYearday',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('month', models.IntegerField()),
                ('day', models.IntegerField()),
                ('employees', models.ManyToManyField(to='api.employee')),
            ],
            options={
                'constraints': [models.UniqueConstraint(fields=('month', 'day'), name='unique_month_day')],
            },
        ),
    ]
