from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

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


# Simulated Email
class SimulatedEmail(models.Model):
    email_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    sender_name = models.CharField(max_length=100)
    sender_email = models.CharField(max_length=255)
    body = models.TextField(editable=False)
    is_phishing = models.BooleanField()
    difficulty = models.CharField(max_length=100)
    category = models.CharField(max_length=100)

# Email Simulation
class EmailSimulation(models.Model):
    simulation_id = models.AutoField(primary_key=True)
    email_id = models.ForeignKey(
        SimulatedEmail,
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    company_id = models.ForeignKey(
        Company,
        on_delete=models.CASCADE
    )
    sent_at = models.DateTimeField()
    interacted_at = models.DateTimeField()
    clicked_link = models.BooleanField()
    reported_as_phishing = models.BooleanField()
    outcome = models.CharField(max_length=255)

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

# Test Lesson
class TestLesson(models.Model):
    test_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(editable=False)
    test_type = models.CharField(max_length=100)
    passing_score = models.IntegerField()
    estimated_minutes = models.IntegerField()

# Question
class Question(models.Model):
    question_id = models.AutoField(primary_key=True)
    test_id = models.ForeignKey(
        TestLesson,
        on_delete=models.CASCADE
    )
    question_text = models.TextField(editable=False)
    question_type = models.CharField(max_length=255)
    points = models.IntegerField()
    order_index = models.IntegerField()

# Answer Choice
class AnswerChoice(models.Model):
    choice_id = models.AutoField(primary_key=True)
    question_id = models.ForeignKey(
        Question,
        on_delete=models.CASCADE
    )
    choice_text = models.TextField(editable=False)
    is_correct = models.BooleanField()

# Assignment
class Assignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    test_id = models.ForeignKey(
        TestLesson,
        on_delete=models.CASCADE
    )
    assigned_by_user_id = models.IntegerField()
    due_date = models.DateTimeField()
    status = models.CharField(max_length=255)

# Attempt
class Attempt(models.Model):
    attempt_id = models.AutoField(primary_key=True)
    assignment_id = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE
    )
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField()
    score = models.DecimalField(decimal_places=2, max_digits=5)
    passed = models.BooleanField()

# Response
class Response(models.Model):
    response_id = models.AutoField(primary_key=True)
    attempt_id = models.ForeignKey(
        Attempt,
        on_delete=models.CASCADE
    )
    question_id = models.ForeignKey(
        Question,
        on_delete=models.CASCADE
    )
    choice_id = models.ForeignKey(
        AnswerChoice,
        on_delete=models.CASCADE
    )
    free_text_answer = models.TextField(editable=True)
    is_correct = models.BooleanField()