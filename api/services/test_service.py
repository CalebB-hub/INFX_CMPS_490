# api/services/test_service.py
from django.db import transaction
from ..models import Test


def create_test(title, description, score, date_taken, user=None, **other):
    """Create a Test instance and return it.

    Parameters mirror the model fields. ``user`` should be a User instance
    or ``None``. Additional model fields can be passed via ``other``.
    """
    with transaction.atomic():
        t = Test.objects.create(
            title=title,
            description=description,
            score=score,
            date_taken=date_taken,
            user_id=user,
            **other,
        )
        # place for any post-creation logic
        return t


def get_test(test_id):
    """Fetch a single Test by primary key."""
    return Test.objects.get(test_id=test_id)


def update_test(test_id, **changes):
    """Update fields on an existing Test and save the object."""
    t = get_test(test_id)
    for k, v in changes.items():
        setattr(t, k, v)
    t.save()
    return t


def delete_test(test_id):
    """Remove a Test record by id."""
    Test.objects.filter(test_id=test_id).delete()
