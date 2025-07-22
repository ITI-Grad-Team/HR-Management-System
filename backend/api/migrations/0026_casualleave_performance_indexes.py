# Generated manually for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0025_casualleave_employeeleavepolicy"),
    ]

    operations = [
        # Add database indexes for better query performance
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_employee_status ON api_casualleave(employee_id, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_employee_status;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_status_created ON api_casualleave(status, created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_status_created;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_dates ON api_casualleave(start_date, end_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_dates;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_employee_user ON api_employee(user_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_employee_user;",
        ),
    ]
