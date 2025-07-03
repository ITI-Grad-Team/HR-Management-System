from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.models import AttendanceRecord, WorkDayConfig, PublicHoliday


class Command(BaseCommand):
    help = "Mark absent users who did not check in today."

    def handle(self, *args, **options):
        today = timezone.localdate()
        User = get_user_model()
        marked_absent = 0

        # 1. Check if today is a public holiday
        if PublicHoliday.objects.filter(date=today).exists():
            self.stdout.write(
                self.style.SUCCESS("Today is a public holiday. No absences marked.")
            )
            return

        # 2. Get all users
        users = User.objects.all()
        weekday = today.weekday()  # Monday=0
        try:
            workday_cfg = WorkDayConfig.objects.get(weekday=weekday)
        except WorkDayConfig.DoesNotExist:
            self.stdout.write(self.style.WARNING("No WorkDayConfig for today."))
            return

        if not workday_cfg.is_workday:
            self.stdout.write(
                self.style.SUCCESS("Today is not a workday. No absences marked.")
            )
            return

        # 3. For each user, check if they have an AttendanceRecord for today
        for user in users:
            if AttendanceRecord.objects.filter(user=user, date=today).exists():
                continue
            # 4. Mark as absent
            AttendanceRecord.objects.create(
                user=user,
                date=today,
                check_in_time=None,
                status="absent",
                attendance_type="online" if workday_cfg.is_online else "physical",
                mac_address=None,
            )
            marked_absent += 1

        self.stdout.write(
            self.style.SUCCESS(f"{marked_absent} users marked as absent for {today}")
        )
