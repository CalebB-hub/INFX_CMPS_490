# api/services/role_service.py
from django.db import transaction
from ..models import Role


def create_role(role_name, description, **other):
    with transaction.atomic():
        r = Role.objects.create(role_name=role_name, description=description, **other)
        return r


def get_role(role_id):
    return Role.objects.get(role_id=role_id)


def update_role(role_id, **changes):
    r = get_role(role_id)
    for k, v in changes.items():
        setattr(r, k, v)
    r.save()
    return r


def delete_role(role_id):
    Role.objects.filter(role_id=role_id).delete()
