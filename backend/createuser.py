import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth.models import User
if not User.objects.filter(username='jchilders057').exists():
    User.objects.create_superuser('jchilders057', 'jchilders057@example.com', 'AdminPassword123')
    print('Superuser created')
else:
    u = User.objects.get(username='jchilders057')
    u.set_password('AdminPassword123')
    u.save()
    print('Password updated')