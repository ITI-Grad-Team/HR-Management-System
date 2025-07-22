# Generated manually for enhanced performance optimization

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0032_populate_casualleave_duration"),
    ]

    operations = [
        # Add compound indexes for common query patterns
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_employee_created ON api_casualleave(employee_id, created_at DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_employee_created;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_status_employee ON api_casualleave(status, employee_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_status_employee;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_duration_status ON api_casualleave(duration, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_duration_status;",
        ),
        # Add covering index for list queries (includes all frequently accessed columns)
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_covering ON api_casualleave(created_at DESC, status, employee_id) INCLUDE (start_date, end_date, duration, reason);",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_covering;",
        ),
        # Optimize BasicInfo lookups for username searches
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_basicinfo_username_lower ON api_basicinfo(LOWER(username));",
            reverse_sql="DROP INDEX IF EXISTS idx_basicinfo_username_lower;",
        ),
        # Add partial indexes for active statuses (faster filtering)
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_pending ON api_casualleave(employee_id, created_at DESC) WHERE status = 'pending';",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_pending;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_casual_leave_approved ON api_casualleave(employee_id, start_date) WHERE status = 'approved';",
            reverse_sql="DROP INDEX IF EXISTS idx_casual_leave_approved;",
        ),
    ]
