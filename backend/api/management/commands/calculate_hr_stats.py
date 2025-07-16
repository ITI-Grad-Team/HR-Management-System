from django.core.management.base import BaseCommand
from api.models import HR  

class Command(BaseCommand):
    help = 'Recalculates accepted employee statistics for all HRs'

    def handle(self, *args, **options):
        hrs = HR.objects.all()
        total = hrs.count()
        self.stdout.write(f"Calculating stats for {total} HR(s)...")

        for i, hr in enumerate(hrs, 1):
            self.stdout.write(f"[{i}/{total}] Calculating for HR ID {hr.id}...", ending="")
            hr.calculate_accepted_employees_stats()
            self.stdout.write(" Done.")

        self.stdout.write(self.style.SUCCESS("All HR stats recalculated successfully."))
