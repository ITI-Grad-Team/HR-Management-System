from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import AttendanceRecord, OvertimeRequest, Employee
from django.conf import settings
from datetime import datetime, timedelta, time, date
import random

User = get_user_model()


class Command(BaseCommand):
    help = "Generate dummy attendance records and overtime requests for employees"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=30,
            help="Number of days to generate attendance records for (default: 30)",
        )
        parser.add_argument(
            "--end-date",
            type=str,
            default=date.today().strftime("%Y-%m-%d"),
            help="End date for attendance records (YYYY-MM-DD, default: today)",
        )

    def handle(self, *args, **options):
        # Employee data
        employees = [
            {
                "email": "emp43@zvvzuv.com",
                "role": "Marketing Specialist",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-04-03",
                "salary": 10000.0,
            },
            {
                "email": "emp15@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": "Giza",
                "join_date": "2025-04-05",
                "salary": 12000.0,
            },
            {
                "email": "emp52@zvvzuv.com",
                "phone_number": "01234321751",
                "role": "Financial Accountant",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-04-07",
                "salary": 8000.0,
            },
            {
                "email": "emp19@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": None,
                "join_date": "2025-04-09",
                "salary": None,
            },
            {
                "email": "emp51@zvvzuv.com",
                "role": "Financial Accountant",
                "is_active": True,
                "city": "Cairo",
                "join_date": "2025-04-09",
                "salary": 12500.0,
            },
            {
                "email": "emp22@zvvzuv.com",
                "role": "Data Analyst",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-04-10",
                "salary": 15000.0,
            },
            {
                "email": "emp20@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": "Giza",
                "join_date": "2025-04-11",
                "salary": None,
            },
            {
                "email": "emp14@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-04-12",
                "salary": 8888.0,
            },
            {
                "email": "emp44@zvvzuv.com",
                "role": "Marketing Specialist",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-04-15",
                "salary": 10000.0,
            },
            {
                "email": "emp18@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-04-21",
                "salary": None,
            },
            {
                "email": "emp36@zvvzuv.com",
                "role": "UI/UX Designer",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-04-24",
                "salary": 20000.0,
            },
            {
                "email": "emp23@zvvzuv.com",
                "role": "Data Analyst",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-04-24",
                "salary": 12000.0,
            },
            {
                "email": "emp21@zvvzuv.com",
                "role": "Data Analyst",
                "is_active": True,
                "city": "Cairo",
                "join_date": "2025-04-26",
                "salary": 25000.0,
            },
            {
                "email": "emp11@zvvzuv.com",
                "role": "Software Developer",
                "is_active": True,
                "city": "Cairo",
                "join_date": "2025-04-27",
                "salary": 9000.0,
            },
            {
                "email": "emp24@zvvzuv.com",
                "role": "Data Analyst",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-01",
                "salary": 10000.0,
            },
            {
                "email": "emp16@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": "Giza",
                "join_date": "2025-05-02",
                "salary": 7777.0,
            },
            {
                "email": "emp35@zvvzuv.com",
                "role": "UI/UX Designer",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-11",
                "salary": 120000.0,
            },
            {
                "email": "emp12@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-11",
                "salary": 10000.0,
            },
            {
                "email": "emp41@zvvzuv.com",
                "role": "Marketing Specialist",
                "is_active": True,
                "city": "Cairo",
                "join_date": "2025-05-11",
                "salary": 10000.0,
            },
            {
                "email": "wfd8ucobgs@mkzaso.com",
                "role": "UI/UX Designer",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-15",
                "salary": 13000.0,
            },
            {
                "email": "emp54@zvvzuv.com",
                "role": "Financial Accountant",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-16",
                "salary": 7500.0,
            },
            {
                "email": "gmpn624mv8@zvvzuv.com",
                "role": "UI/UX Designer",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-20",
                "salary": 12000.0,
            },
            {
                "email": "emp42@zudpck.com",
                "role": "Marketing Specialist",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-21",
                "salary": 10000.0,
            },
            {
                "email": "emp13@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": "Giza",
                "join_date": "2025-05-22",
                "salary": 8000.0,
            },
            {
                "email": "emp53@zvvzuv.com",
                "role": "Financial Accountant",
                "is_active": False,
                "city": None,
                "join_date": "2025-05-22",
                "salary": 9000.0,
            },
            {
                "email": "emp25@zvvzuv.com",
                "role": "Data Analyst",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-25",
                "salary": 16000.0,
            },
            {
                "email": "emp17@zvvzuv.com",
                "role": "Software Developer",
                "is_active": False,
                "city": None,
                "join_date": "2025-05-25",
                "salary": 9999.0,
            },
            {
                "email": "emp45@zvvzuv.com",
                "role": "Marketing Specialist",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-25",
                "salary": 10000.0,
            },
            {
                "email": "pfm8j37tgn@qzueos.com",
                "role": "UI/UX Designer",
                "is_active": True,
                "city": "Cairo",
                "join_date": "2025-05-31",
                "salary": 10000.0,
            },
            {
                "email": "emp55@zvvzuv.com",
                "role": "Financial Accountant",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-05-31",
                "salary": 12000.0,
            },
            {
                "email": "emp37@zvvzuv.com",
                "role": "UI/UX Designer",
                "is_active": False,
                "city": "Cairo",
                "join_date": "2025-07-24",
                "salary": 150000.0,
            },
        ]

        # Parse arguments
        max_days = options["days"]
        try:
            end_date = date.fromisoformat(options["end_date"])
        except ValueError:
            self.stdout.write(
                self.style.ERROR("Invalid end-date format. Use YYYY-MM-DD")
            )
            return

        # Create missing Employee records
        for emp_data in employees:
            user = User.objects.filter(username=emp_data["email"]).first()
            if not user:
                self.stdout.write(
                    self.style.WARNING(f"User {emp_data['email']} not found. Skipping.")
                )
                continue
            if not hasattr(user, "employee"):
                Employee.objects.create(
                    user=user,
                    phone_number=emp_data.get("phone_number", ""),
                    role=emp_data["role"],
                    is_active=emp_data["is_active"],
                    city=emp_data["city"],
                    join_date=datetime.strptime(
                        emp_data["join_date"], "%Y-%m-%d"
                    ).date(),
                    salary=emp_data["salary"],
                    expected_attend_time=time(9, 0),
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created Employee record for {emp_data['email']}"
                    )
                )

        # Set default expected_attend_time
        default_attend_time = time(9, 0)  # 9:00 AM
        for emp_data in employees:
            user = User.objects.filter(username=emp_data["email"]).first()
            if user and hasattr(user, "employee"):
                employee = user.employee
                if not employee.expected_attend_time:
                    employee.expected_attend_time = default_attend_time
                    employee.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Set expected_attend_time for {emp_data['email']}"
                        )
                    )

        # Find HR user for overtime requests
        hr_user = User.objects.filter(is_staff=True).first() or User.objects.first()

        # Track counts
        attendance_created = 0
        overtime_created = 0
        skipped_users = 0
        skipped_records = 0

        # Helper function to generate random time
        def random_time(start_hour, end_hour, start_minute=0, end_minute=0):
            start = datetime(2025, 1, 1, start_hour, start_minute)
            end = datetime(2025, 1, 1, end_hour, end_minute)
            delta = end - start
            random_seconds = random.randint(0, int(delta.total_seconds()))
            return (start + timedelta(seconds=random_seconds)).time()

        # Generate attendance records
        for emp_data in employees:
            user = User.objects.filter(username=emp_data["email"]).first()
            if not user:
                self.stdout.write(
                    self.style.WARNING(f"User {emp_data['email']} not found. Skipping.")
                )
                skipped_users += 1
                continue
            if not hasattr(user, "employee"):
                self.stdout.write(
                    self.style.WARNING(
                        f"Employee record for {emp_data['email']} not found. Skipping."
                    )
                )
                skipped_users += 1
                continue

            join_date = datetime.strptime(emp_data["join_date"], "%Y-%m-%d").date()
            start_date = join_date + timedelta(days=1)  # Start day after join_date
            current_date = start_date
            max_days_for_user = min(max_days, (end_date - start_date).days + 1)

            for _ in range(max_days_for_user):
                # Skip weekends (Saturday, Sunday)
                if current_date.weekday() >= 5:
                    current_date += timedelta(days=1)
                    continue

                # Skip if date exceeds end_date
                if current_date > end_date:
                    break

                # Randomize attendance data
                status = random.choices(
                    ["present", "late", "absent"], weights=[0.7, 0.2, 0.1]
                )[0]
                check_in_time = None
                check_out_time = None
                overtime_hours = 0.0
                overtime_approved = False
                lateness_hours = 0.0
                attendance_type = random.choice(["physical", "online"])

                if status != "absent":
                    check_in_time = random_time(8, 10)  # 8:00 AM - 10:00 AM
                    # Adjust check_out_time to favor overtime eligibility
                    if (
                        random.random() < 0.3
                    ):  # 30% chance of overtime-eligible check-out
                        check_out_time = random_time(17, 19, 30, 0)  # 5:30 PM - 7:00 PM
                    else:
                        check_out_time = random_time(16, 17, 0, 30)  # 4:00 PM - 5:30 PM

                    # Adjust status based on check_in_time
                    if check_in_time > time(9, 15):
                        status = "late"
                    else:
                        status = "present"

                    # Calculate lateness
                    if status == "late":
                        check_in_dt = datetime.combine(current_date, check_in_time)
                        grace_dt = datetime.combine(
                            current_date, time(9, 15)
                        )  # 9:15 AM
                        lateness_seconds = (check_in_dt - grace_dt).total_seconds()
                        lateness_hours = round(lateness_seconds / 3600, 2)

                    # Calculate overtime if check_out_time is after 5:30 PM
                    if check_out_time and check_out_time > time(17, 30):
                        check_out_dt = datetime.combine(current_date, check_out_time)
                        base_dt = datetime.combine(
                            current_date, time(17, 0)
                        )  # Calculate from 5:00 PM
                        overtime_seconds = (check_out_dt - base_dt).total_seconds()
                        overtime_hours = round(overtime_seconds / 3600, 2)

                else:
                    # Ensure absent records have no check-in/check-out
                    check_in_time = None
                    check_out_time = None
                    attendance_type = "physical"  # Default for absent

                # Check if attendance record already exists
                if AttendanceRecord.objects.filter(
                    user=user, date=current_date
                ).exists():
                    self.stdout.write(
                        f"⏭️ Attendance record already exists for {emp_data['email']} on {current_date}"
                    )
                    skipped_records += 1
                    current_date += timedelta(days=1)
                    continue

                # Create attendance record
                try:
                    attendance = AttendanceRecord.objects.create(
                        user=user,
                        date=current_date,
                        check_in_time=check_in_time,
                        check_out_time=check_out_time,
                        attendance_type=attendance_type,
                        status=status,
                        lateness_hours=lateness_hours,
                        overtime_hours=0.0,  # Set later if approved
                        overtime_approved=False,
                        check_in_latitude=(
                            30.0444
                            if emp_data["city"] == "Cairo"
                            else 30.0626 if emp_data["city"] == "Giza" else None
                        ),
                        check_in_longitude=(
                            31.2357
                            if emp_data["city"] == "Cairo"
                            else 31.2078 if emp_data["city"] == "Giza" else None
                        ),
                        check_out_latitude=(
                            30.0444
                            if emp_data["city"] == "Cairo"
                            else 30.0626 if emp_data["city"] == "Giza" else None
                        ),
                        check_out_longitude=(
                            31.2357
                            if emp_data["city"] == "Cairo"
                            else 31.2078 if emp_data["city"] == "Giza" else None
                        ),
                    )
                    attendance_created += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"📅 Created attendance for {emp_data['email']} on {current_date} (Status: {status}, Lateness: {lateness_hours}h)"
                        )
                    )

                    # Create overtime request if check_out_time > 5:30 PM
                    if overtime_hours > 0:
                        overtime_status = random.choices(
                            ["pending", "approved", "rejected"], weights=[0.5, 0.3, 0.2]
                        )[0]
                        hr_comment = ""
                        reviewed_at = None
                        reviewed_by = None
                        if overtime_status in ["approved", "rejected"]:
                            hr_comment = f"{overtime_status.capitalize()} by HR for {overtime_hours} hours."
                            reviewed_at = datetime.now()
                            reviewed_by = hr_user
                        if overtime_status == "approved":
                            attendance.overtime_hours = overtime_hours
                            attendance.overtime_approved = True
                            attendance.save()
                        OvertimeRequest.objects.create(
                            attendance_record=attendance,
                            requested_hours=overtime_hours,
                            status=overtime_status,
                            hr_comment=hr_comment,
                            reviewed_at=reviewed_at,
                            reviewed_by=reviewed_by,
                        )
                        overtime_created += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"📈 Created overtime request for {emp_data['email']} on {current_date} ({overtime_status}, {overtime_hours}h)"
                            )
                        )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Error creating attendance for {emp_data['email']} on {current_date}: {e}"
                        )
                    )
                    skipped_records += 1

                current_date += timedelta(days=1)

        # Summary
        self.stdout.write("\n📊 Summary:")
        self.stdout.write(f"📅 Attendance records created: {attendance_created}")
        self.stdout.write(f"📈 Overtime requests created: {overtime_created}")
        self.stdout.write(f"⏭️ Skipped records (existing or errors): {skipped_records}")
        self.stdout.write(f"⚠️ Skipped users (missing User/Employee): {skipped_users}")
