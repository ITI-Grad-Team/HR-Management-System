from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Employee, BasicInfo


class Command(BaseCommand):
    help = "Check existing employees and their user relationships"

    def handle(self, *args, **options):
        # Check Users
        users = User.objects.all()
        self.stdout.write(self.style.SUCCESS(f"Total Users: {users.count()}"))

        # Check Employees
        employees = Employee.objects.all()
        self.stdout.write(self.style.SUCCESS(f"Total Employees: {employees.count()}"))

        # Check BasicInfo
        basic_infos = BasicInfo.objects.all()
        self.stdout.write(
            self.style.SUCCESS(f"Total BasicInfo records: {basic_infos.count()}")
        )

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("EMPLOYEE DETAILS:")
        self.stdout.write("=" * 60)

        if employees.exists():
            for employee in employees:
                user = employee.user
                try:
                    basic_info = BasicInfo.objects.get(user=user)
                    username = basic_info.username or "No username"
                except BasicInfo.DoesNotExist:
                    username = "No BasicInfo"

                self.stdout.write(
                    f"Employee ID: {employee.id} | "
                    f"User: {user.username} | "
                    f'Email: {user.email or "No email"} | '
                    f"BasicInfo Username: {username}"
                )
        else:
            self.stdout.write(self.style.WARNING("No employees found"))

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("USERS WITHOUT EMPLOYEE RECORDS:")
        self.stdout.write("=" * 60)

        users_without_employees = User.objects.exclude(employee__isnull=False)
        if users_without_employees.exists():
            for user in users_without_employees:
                self.stdout.write(
                    f'User: {user.username} | Email: {user.email or "No email"} | '
                    f"Staff: {user.is_staff} | Superuser: {user.is_superuser}"
                )
        else:
            self.stdout.write(self.style.SUCCESS("All users have employee records"))

        # Check for users with emails matching our pattern
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("EMAIL PATTERNS CHECK:")
        self.stdout.write("=" * 60)

        target_emails = [
            "emp43@zvvzuv.com",
            "emp15@zvvzuv.com",
            "emp52@zvvzuv.com",
            "emp19@zvvzuv.com",
            "emp51@zvvzuv.com",
            "emp22@zvvzuv.com",
        ]

        for email in target_emails[:6]:  # Check first 6 emails
            user_exists = User.objects.filter(email=email).exists()
            if user_exists:
                user = User.objects.get(email=email)
                has_employee = hasattr(user, "employee")
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ {email} - User exists, Has Employee: {has_employee}"
                    )
                )
            else:
                self.stdout.write(self.style.ERROR(f"✗ {email} - User not found"))
