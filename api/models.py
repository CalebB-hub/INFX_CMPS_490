from django.db import models
from django.db import transaction
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from decimal import Decimal

# Create your models here.

# Company
class Company(models.Model):
    company_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)

# Role
class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    permissions = models.TextField()

# User
class User(AbstractUser):
    # keep original primary key name so existing data/migrations remain valid
    user_id = models.AutoField(primary_key=True)

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE
    )
    company = models.ForeignKey(
        Company,
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )
    # AbstractUser already provides first_name, last_name, email and password
    # along with authentication helpers; no need for our own versions.

    def __str__(self):
        return self.username

# Subscription Plan
class SubscriptionPlan(models.Model):
    plan_id = models.AutoField(primary_key=True)
    plan_name = models.CharField(max_length=255)
    price = models.DecimalField(decimal_places=2, max_digits=6)
    max_users = models.IntegerField()
    features_notes = models.TextField(editable=False)

# Subscriptions
class Subscriptions(models.Model):
    subscription_id = models.AutoField(primary_key=True)
    company_id = models.OneToOneField(
        Company,
        on_delete=models.CASCADE
    )
    plan_id = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.CASCADE
    )
    status = models.CharField(max_length=255)
    start_date = models.DateField()
    end_Date = models.DateField()

# Test
class Test(models.Model):
    test_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(editable=False)
    score = models.DecimalField(decimal_places=2, max_digits=5)
    date_taken = models.DateTimeField()
    user_id = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )

# Question
class Question(models.Model):
    question_id = models.AutoField(primary_key=True)
    test_id = models.ForeignKey(
        Test,
        on_delete=models.CASCADE
    )
    question_text = models.TextField(editable=False)
    question_type = models.CharField(max_length=255)
    answer = models.CharField(max_length=255)
    response = models.CharField(max_length=255)
    score = models.DecimalField(decimal_places=2, max_digits=5)

# Assignment
class Assignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    company_id = models.ForeignKey(
        Company,
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )
    test_id = models.ForeignKey(
        Test,
        on_delete=models.CASCADE
    )
    due_date = models.DateTimeField()
    start_date = models.DateTimeField()

class Lesson(models.Model):
    lesson_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    choices = models.TextField()
    questions = models.TextField()
    answers = models.TextField()
    lesson_material = models.TextField()


class LessonScore(models.Model):
    lesson_score_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_scores'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='scores'
    )
    score = models.DecimalField(decimal_places=2, max_digits=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'lesson'], name='unique_user_lesson_score')
        ]

    @classmethod
    def record_attempt(cls, user, lesson, score):
        score_value = Decimal(str(score))

        with transaction.atomic():
            lesson_score, created = cls.objects.select_for_update().get_or_create(
                user=user,
                lesson=lesson,
                defaults={'score': score_value},
            )

            if created:
                return lesson_score, True

            if score_value > lesson_score.score:
                lesson_score.score = score_value
                lesson_score.save(update_fields=['score', 'updated_at'])
                return lesson_score, True

            return lesson_score, False

