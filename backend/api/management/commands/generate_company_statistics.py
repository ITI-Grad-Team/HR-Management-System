from django.core.management.base import BaseCommand
from datetime import date
from api.models import CompanyStatistics
from api.views import calculate_statistics

class Command(BaseCommand):
    help = "Generate a nightly snapshot of company statistics."

    def handle(self, *args, **options):
        # Optional: Prevent duplicate snapshots on the same day.
        if CompanyStatistics.objects.filter(snapshot_date=date.today()).exists():
            self.stdout.write("Snapshot for today already exists. Exiting.")
            return

        stats = calculate_statistics()
        CompanyStatistics.objects.create(
            total_employees=stats['total_employees'],
            total_hrs=stats['total_hrs'],
            position_stats=stats['position_stats'],
            monthly_salary_totals=stats['monthly_salary_totals'],
            overall_avg_task_rating=stats['overall_avg_task_rating'],
            overall_avg_time_remaining=stats['overall_avg_time_remaining'],
            overall_avg_overtime=stats['overall_avg_overtime'],
            overall_avg_lateness=stats['overall_avg_lateness'],
            overall_avg_absent_days=stats['overall_avg_absent_days'],
            overall_avg_salary=stats['overall_avg_salary'],
        )
        self.stdout.write(self.style.SUCCESS("Successfully generated the nightly company statistics snapshot."))
