# api/services/assignment_service.py
from django.db import transaction
from ..models import Assignment


from django.utils import timezone

def create_assignment(user, company=None, test=None, due_date=None, start_date=None, **other):
    """Create a new Assignment record.

    ``start_date`` will default to ``timezone.now()`` if not provided to satisfy
    the non-null constraint added in migrations.
    """
    if start_date is None:
        start_date = timezone.now()

    with transaction.atomic():
        a = Assignment.objects.create(
            user=user,
            company_id=company,
            test_id=test,
            due_date=due_date,
            start_date=start_date,
            **other,
        )
        return a


def get_assignment(assignment_id):
    return Assignment.objects.get(assignment_id=assignment_id)


def update_assignment(assignment_id, **changes):
    a = get_assignment(assignment_id)
    for k, v in changes.items():
        setattr(a, k, v)
    a.save()
    return a


def delete_assignment(assignment_id):
    Assignment.objects.filter(assignment_id=assignment_id).delete()
