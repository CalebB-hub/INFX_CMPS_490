# api/services/question_service.py
from django.db import transaction
from ..models import Question


def create_question(test, question_text, question_type, answer, response, score, **other):
    """Create a Question linked to a Test instance."""
    with transaction.atomic():
        q = Question.objects.create(
            test_id=test,
            question_text=question_text,
            question_type=question_type,
            answer=answer,
            response=response,
            score=score,
            **other,
        )
        return q


def get_question(question_id):
    return Question.objects.get(question_id=question_id)


def update_question(question_id, **changes):
    q = get_question(question_id)
    for k, v in changes.items():
        setattr(q, k, v)
    q.save()
    return q


def delete_question(question_id):
    Question.objects.filter(question_id=question_id).delete()
