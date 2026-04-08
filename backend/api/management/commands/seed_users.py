from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group

class Command(BaseCommand):
    help = 'Creates initial groups and users for the system'

    def handle(self, *args, **kwargs):

        # ── 1. CREATE GROUPS (ROLES) ─────────────────────────────
        groups = [
            'SuperAdmin',
            'Purchases',
            'Purchases_Admin',
            'Industrialization',
            'Industrialization_Admin',
            'Supplier',
        ]

        self.stdout.write('\nCreating groups...')
        for name in groups:
            group, created = Group.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f'  ✓ Group created: {name}')
            else:
                self.stdout.write(f'  — Group already exists: {name}')

        # ── 2. CREATE TEST USERS ─────────────────────────────────
        users = [
            # Global Super Admin
            {
                'username': 'superadmin',
                'password': 'admin1234',
                'email': 'superadmin@bocar.com',
                'group': 'SuperAdmin',
                'is_staff': True,
                'is_active': True,
            },
            # Purchases - Standard User
            {
                'username': 'purchases_user',
                'password': 'purchases1234',
                'email': 'purchases@bocar.com',
                'group': 'Purchases',
                'is_staff': False,
                'is_active': True,
            },
            # Purchases - Admin
            {
                'username': 'purchases_admin',
                'password': 'purchases1234',
                'email': 'purchases.admin@bocar.com',
                'group': 'Purchases_Admin',
                'is_staff': False,
                'is_active': True,
            },
            # Industrialization - Standard User
            {
                'username': 'ind_user',
                'password': 'ind1234',
                'email': 'ind@bocar.com',
                'group': 'Industrialization',
                'is_staff': False,
                'is_active': True,
            },
            # Industrialization - Admin
            {
                'username': 'ind_admin',
                'password': 'ind1234',
                'email': 'ind.admin@bocar.com',
                'group': 'Industrialization_Admin',
                'is_staff': False,
                'is_active': True,
            },
            # Supplier - Standard User
            {
                'username': 'supplier_user',
                'password': 'supplier1234',
                'email': 'supplier@external.com',
                'group': 'Supplier',
                'is_staff': False,
                'is_active': True,
            },
        ]

        self.stdout.write('\nCreating users...')
        for data in users:
            if User.objects.filter(username=data['username']).exists():
                self.stdout.write(f"  — User already exists: {data['username']}")
                continue

            user = User.objects.create_user(
                username=data['username'],
                password=data['password'],
                email=data['email'],
                is_staff=data['is_staff'],
                is_active=data['is_active'],
            )

            group = Group.objects.get(name=data['group'])
            user.groups.add(group)

            self.stdout.write(
                self.style.SUCCESS(f"  ✓ {data['username']} → {data['group']}")
            )

        self.stdout.write(
            self.style.SUCCESS('\nDone. Initial users and groups created.\n')
        )