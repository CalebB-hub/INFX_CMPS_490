# api/services/company_service.py
from django.db import transaction
from ..models import Company


def create_company(name, location, **other):
    """Create and return a Company instance."""
    with transaction.atomic():
        c = Company.objects.create(name=name, location=location, **other)
        return c


def get_company(company_id):
    return Company.objects.get(company_id=company_id)


def update_company(company_id, **changes):
    c = get_company(company_id)
    for k, v in changes.items():
        setattr(c, k, v)
    c.save()
    return c


def delete_company(company_id):
    Company.objects.filter(company_id=company_id).delete()
