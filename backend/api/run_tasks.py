import schedule
import time
import logging
from django.core.management import call_command

try:
    from django_tenants.utils import tenant_context, get_tenant_model
    HAS_TENANTS = True
except ImportError:
    HAS_TENANTS = False

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s %(asctime)s %(module)s %(message)s',
    handlers=[
        logging.FileHandler('hr_management.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def run_command(command_name, tenant_schema=None):
    logger.info(f"Starting {command_name} for tenant {tenant_schema or 'default'}")
    try:
        if HAS_TENANTS and tenant_schema:
            tenant = get_tenant_model().objects.get(schema_name=tenant_schema)
            with tenant_context(tenant):
                call_command(command_name)
        else:
            call_command(command_name)
        logger.info(f"{command_name} completed for tenant {tenant_schema or 'default'}")
    except Exception as e:
        logger.error(f"{command_name} failed for tenant {tenant_schema or 'default'}: {e}")

def schedule_tasks():
    # Run recalculate_hr_stats every 12 hours
    schedule.every(12).hours.do(run_command, command_name='recalculate_hr_stats')

    # Run nightly_stats, mark_absent, train_employee_models daily at 12 PM for each tenant
    if HAS_TENANTS:
        try:
            for tenant in get_tenant_model().objects.all():
                tz = tenant.timezone or 'Europe/Helsinki'  # EEST (UTC+3)
                schedule.every().day.at("12:00", tz).do(run_command, command_name='nightly_stats', tenant_schema=tenant.schema_name)
                schedule.every().day.at("12:00", tz).do(run_command, command_name='mark_absent', tenant_schema=tenant.schema_name)
                schedule.every().day.at("12:00", tz).do(run_command, command_name='train_employee_models', tenant_schema=tenant.schema_name)
        except:
            # Fallback for non-multi-tenant setup with django-tenants
            schedule.every().day.at("12:00", 'Europe/Helsinki').do(run_command, command_name='nightly_stats')
            schedule.every().day.at("12:00", 'Europe/Helsinki').do(run_command, command_name='mark_absent')
            schedule.every().day.at("12:00", 'Europe/Helsinki').do(run_command, command_name='train_employee_models')
    else:
        # Fallback for single-tenant or no django-tenants
        schedule.every().day.at("12:00", 'Europe/Helsinki').do(run_command, command_name='nightly_stats')
        schedule.every().day.at("12:00", 'Europe/Helsinki').do(run_command, command_name='mark_absent')
        schedule.every().day.at("12:00", 'Europe/Helsinki').do(run_command, command_name='train_employee_models')

def run_continuously():
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    # Ensure Django settings are loaded
    import os
    import django
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")  # Replace with your settings module
    django.setup()
    schedule_tasks()
    run_continuously()