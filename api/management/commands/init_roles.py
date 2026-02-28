from django.core.management.base import BaseCommand
from api.models import Role


class Command(BaseCommand):
    help = 'Initialize manager and employee roles'

    def handle(self, *args, **options):
        # Create Manager role
        manager_role, created = Role.objects.get_or_create(
            role_name=Role.MANAGER,
            defaults={
                'description': 'Manager role with ability to add, remove, and update accounts in their company'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Manager role created'))
        else:
            self.stdout.write('Manager role already exists')
        
        # Create Employee role
        employee_role, created = Role.objects.get_or_create(
            role_name=Role.EMPLOYEE,
            defaults={
                'description': 'Employee role with ability to update only their own account'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Employee role created'))
        else:
            self.stdout.write('Employee role already exists')
        
        self.stdout.write(self.style.SUCCESS('Successfully initialized roles'))
