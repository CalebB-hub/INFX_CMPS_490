from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase
from django.urls import reverse

from .models import Role, Company, User, Test as TestModel
from .services import (
    user_service,
    company_service,
    role_service,
    test_service,
    question_service,
    assignment_service,
)


class ServiceLayerTests(TestCase):
    """Simple smoke tests for each of the CRUD service modules."""

    def setUp(self):
        # make a couple of base objects reused by tests
        self.role = role_service.create_role(
            role_name="tester", description="for tests"
        )
        self.company = company_service.create_company(
            name="Acme", location="Nowhere"
        )
        self.user = user_service.create_user(
            username="foo",
            password="pass",
            role=self.role,
            company=self.company,
        )
        # create a TestModel instance for question/assignment tests
        self.test = test_service.create_test(
            title="t1",
            description="desc",
            score=10,
            date_taken=timezone.now(),
            user=self.user,
        )

    def test_company_crud(self):
        c = company_service.get_company(self.company.company_id)
        self.assertEqual(c.name, "Acme")
        company_service.update_company(c.company_id, location="Elsewhere")
        c.refresh_from_db()
        self.assertEqual(c.location, "Elsewhere")
        company_service.delete_company(c.company_id)
        self.assertFalse(Company.objects.filter(company_id=c.company_id).exists())

    def test_role_crud(self):
        r = role_service.get_role(self.role.role_id)
        self.assertEqual(r.role_name, "tester")
        role_service.update_role(r.role_id, description="updated")
        r.refresh_from_db()
        self.assertEqual(r.description, "updated")
        role_service.delete_role(r.role_id)
        self.assertFalse(Role.objects.filter(role_id=r.role_id).exists())

    def test_user_crud(self):
        u = user_service.get_user(self.user.user_id)
        self.assertEqual(u.username, "foo")
        user_service.update_user(u.user_id, first_name="F")
        u.refresh_from_db()
        self.assertEqual(u.first_name, "F")
        user_service.delete_user(u.user_id)
        self.assertFalse(User.objects.filter(user_id=u.user_id).exists())

    def test_test_crud(self):
        t = test_service.get_test(self.test.test_id)
        self.assertEqual(t.title, "t1")
        test_service.update_test(t.test_id, score=20)
        t.refresh_from_db()
        self.assertEqual(float(t.score), 20.0)
        test_service.delete_test(t.test_id)
        self.assertFalse(TestModel.objects.filter(test_id=t.test_id).exists())

    def test_question_crud(self):
        q = question_service.create_question(
            test=self.test,
            question_text="q1",
            question_type="mc",
            answer="a",
            response="r",
            score=5,
        )
        fetched = question_service.get_question(q.question_id)
        self.assertEqual(fetched.question_text, "q1")
        question_service.update_question(q.question_id, response="x")
        q.refresh_from_db()
        self.assertEqual(q.response, "x")
        question_service.delete_question(q.question_id)
        from .models import Question
        self.assertFalse(Question.objects.filter(question_id=q.question_id).exists())

    def test_assignment_crud(self):
        a = assignment_service.create_assignment(
            user=self.user, company=self.company, test=self.test, due_date=timezone.now()
        )
        fetched = assignment_service.get_assignment(a.assignment_id)
        self.assertEqual(fetched.user, self.user)
        assignment_service.update_assignment(a.assignment_id, due_date=timezone.now())
        a.refresh_from_db()
        assignment_service.delete_assignment(a.assignment_id)
        from .models import Assignment
        self.assertFalse(Assignment.objects.filter(assignment_id=a.assignment_id).exists())


class AuthEndpointTests(APITestCase):
    """Tests for authentication-related API endpoints."""

    def setUp(self):
        # create a user that can log in
        role, _ = Role.objects.get_or_create(
            role_name='User',
            defaults={'description': 'default', 'permissions': ''}
        )
        self.user = User.objects.create_user(
            username='bob@example.com',
            email='bob@example.com',
            password='secret',
            role=role,
        )

    def obtain_token_pair(self):
        url = reverse('login')
        resp = self.client.post(url, {'email': self.user.email, 'password': 'secret'}, format='json')
        self.assertEqual(resp.status_code, 200)
        return resp.data['accessToken'], resp.data['refreshToken']

    def test_logout_blacklists_refresh(self):
        access, refresh = self.obtain_token_pair()

        # logout using refresh token
        url = reverse('logout')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        resp = self.client.post(url, {'refreshToken': refresh}, format='json')
        self.assertEqual(resp.status_code, 204)

        # attempting to blacklist the same refresh token again should raise an error
        from rest_framework_simplejwt.tokens import RefreshToken
        with self.assertRaises(Exception):
            RefreshToken(refresh).blacklist()

    def test_logout_requires_token(self):
        access, _ = self.obtain_token_pair()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        resp = self.client.post(reverse('logout'), {}, format='json')
        self.assertEqual(resp.status_code, 400)
