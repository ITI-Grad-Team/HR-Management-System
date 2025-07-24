from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
import datetime
import random

User = get_user_model()

class Command(BaseCommand):
    help = "Generate dummy attendance and overtime data"

    def handle(self, *args, **kwargs):
        from api.models import AttendanceRecord, OvertimeRequest, Employee

        today = timezone.now().date()
        users = User.objects.filter(is_staff=False, is_superuser=False)
        print(f"🔍 Found {users.count()} users.\n")

        for user in users:
            try:
                employee = Employee.objects.get(user=user)
            except Employee.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"⏭ Skipping {user.username} (no employee profile)"))
                continue

            if not employee.join_date:
                self.stdout.write(self.style.WARNING(f"⏭ Skipping {user.username} (no join_date)"))
                continue

            start_date = employee.join_date + datetime.timedelta(days=1)
            if start_date >= today:
                self.stdout.write(self.style.WARNING(f"⏭ Skipping {user.username} (join date in future or today)"))
                continue

            print(f"📅 Generating attendance for {user.username} from {start_date} to {today}")

            for single_date in self.daterange(start_date, today):
                if single_date.weekday() >= 5 or single_date == today:
                    continue

                if AttendanceRecord.objects.filter(user=user, date=single_date).exists():
                    continue

                print(f"➕ Adding record for {user.username} on {single_date}")

                check_in_hour = random.choice([8, 8, 9, 9, 10])
                check_in_minute = random.randint(0, 59)
                check_in_time = datetime.time(hour=check_in_hour, minute=check_in_minute)
                check_out_time = datetime.time(hour=17, minute=random.randint(0, 59))

                attendance_type = random.choice(["physical", "online"])
                status = "present" if check_in_hour <= 9 else "late"

                lateness = self.calculate_lateness(check_in_time)
                overtime = self.calculate_overtime(check_out_time)

                mac_address = f"00:1B:44:11:3A:{random.randint(10, 99)}"
                lat = 30.0444 + random.uniform(-0.01, 0.01)
                lon = 31.2357 + random.uniform(-0.01, 0.01)

                attendance = AttendanceRecord.objects.create(
                    user=user,
                    date=single_date,
                    check_in_time=check_in_time,
                    check_out_time=check_out_time,
                    attendance_type=attendance_type,
                    status=status,
                    mac_address=mac_address if attendance_type == "physical" else None,
                    check_in_latitude=lat if attendance_type == "physical" else None,
                    check_in_longitude=lon if attendance_type == "physical" else None,
                    check_out_latitude=lat if attendance_type == "physical" else None,
                    check_out_longitude=lon if attendance_type == "physical" else None,
                    lateness_hours=lateness,
                    overtime_hours=overtime,
                )

                if overtime > 0:
                    OvertimeRequest.objects.create(
                        attendance_record=attendance,
                        requested_hours=overtime,
                        status=random.choice(["pending", "approved", "rejected"]),
                        hr_comment="Auto-generated request",
                    )

        self.stdout.write(self.style.SUCCESS("\n✅ Dummy attendance and overtime data created successfully."))

    def daterange(self, start_date, end_date):
        for n in range((end_date - start_date).days):
            yield start_date + datetime.timedelta(n)

    def calculate_lateness(self, check_in_time):
        allowed_time = datetime.datetime.combine(datetime.date.today(), datetime.time(9, 15))
        actual_time = datetime.datetime.combine(datetime.date.today(), check_in_time)
        delta = actual_time - allowed_time
        return round(delta.total_seconds() / 60) if delta.total_seconds() > 0 else 0

    def calculate_overtime(self, check_out_time):
        end_time = datetime.datetime.combine(datetime.date.today(), datetime.time(17, 0))
        actual_time = datetime.datetime.combine(datetime.date.today(), check_out_time)
        delta = actual_time - end_time
        return round(delta.total_seconds() / 3600, 2) if delta.total_seconds() > 0 else 0
