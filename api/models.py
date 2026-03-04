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

class Module(models.Model):
    module_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    difficulty_level = models.CharField(max_length=50, default='beginner')  # beginner, intermediate, advanced
    estimated_duration = models.IntegerField(help_text='Estimated duration in minutes')
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Lesson(models.Model):
    lesson_id = models.AutoField(primary_key=True)
    module = models.ForeignKey(
        Module,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='lessons'
    )
    title = models.CharField(max_length=255)
    score = models.DecimalField(decimal_places=2, max_digits=5, null=True, blank=True)
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    questions = models.TextField()
    lesson_material = models.TextField()
    completed_at = models.DateTimeField(null=True, blank=True)