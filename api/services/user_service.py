# api/services/user_service.py
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

def create_user(username, password, *, role, company=None, **other):
    with transaction.atomic():
        u = User.objects.create_user(
            username=username,
            password=password,
            role=role,
            company=company,
            **other,
        )
        # additional business logic here…
        return u

def get_user(user_id):
    return User.objects.get(user_id=user_id)

def update_user(user_id, **changes):
    u = get_user(user_id)
    password = changes.pop('password', None)
    for k, v in changes.items():
        setattr(u, k, v)
    if password:
        u.set_password(password)
    u.save()
    return u

def delete_user(user_id):
    User.objects.filter(user_id=user_id).delete()