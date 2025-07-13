from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import (
    AttendanceRecord,
    Employee,
    HolidayYearday,
    HolidayWeekday,
    OnlineDayYearday,
    OnlineDayWeekday
)

class Command(BaseCommand):
    help = "Mark employees absent for yesterday based on their personal schedules"

    def handle(self, *args, **options):
        yesterday = timezone.localdate() - timezone.timedelta(days=1)
        yesterday_weekday = yesterday.strftime("%A")  # e.g. "Monday"
        marked_absent = 0

        for employee in Employee.objects.filter(interview_state="accepted"):
            
            # 1. Skip if just joined yesterday (or even later: a very rare corner case, 
            #    it can happen when the command is called in the midday 
            #    after someone is accepted on that day. That's one reason why the command is meant 
            #    to be called just after every midnight)
            if employee.join_date >= yesterday:
                continue
            
            # 1. Skip if attended yesterday
            if AttendanceRecord.objects.filter(
                user=employee.user, 
                date=yesterday
            ).exists():
                employee.number_of_non_holiday_days_since_join += 1
                employee.save(update_fields=["number_of_non_holiday_days_since_join"])

                continue

            # 2. Check if yesterday was a personal holiday
            is_holiday = (
                HolidayYearday.objects.filter(
                    month=yesterday.month,
                    day=yesterday.day,
                    employees=employee
                ).exists() or
                HolidayWeekday.objects.filter(
                    weekday=yesterday_weekday,
                    employees=employee
                ).exists()
            )
            if is_holiday:
                continue

            employee.total_absent_days += 1
            employee.number_of_non_holiday_days_since_join += 1
            employee.save(update_fields=["total_absent_days", "number_of_non_holiday_days_since_join"])

            # 3. Check if yesterday was a personal online day
            is_online_day = (
                OnlineDayYearday.objects.filter(
                    month=yesterday.month,
                    day=yesterday.day,
                    employees=employee
                ).exists() or
                OnlineDayWeekday.objects.filter(
                    weekday=yesterday_weekday,
                    employees=employee
                ).exists()
            )



            # 4. Create absent record
            AttendanceRecord.objects.create(
                user=employee.user,
                date=yesterday,
                check_in_time=None,
                status="absent",
                attendance_type="online" if is_online_day else "physical",
                mac_address=None,
            )
            marked_absent += 1
            self.stdout.write(
                f"Marked absent: {employee.user.username} "
                f"({'online' if is_online_day else 'physical'} day)"
            )

        self.stdout.write(
            self.style.SUCCESS(f"Marked {marked_absent} employees as absent for {yesterday}")
        )