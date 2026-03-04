from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Role, Company, User, Test as TestModel, Module, Lesson, Assignment
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

    def test_signup_and_login(self):
        """Test that a newly created user can log in."""
        client = APIClient()
        
        # Sign up with new user
        signup_resp = client.post(
            reverse('signup'),
            {
                'email': 'newuser@example.com',
                'password': 'NewPass123!',
                'firstName': 'New',
                'lastName': 'User',
            },
            format='json'
        )
        
        self.assertEqual(signup_resp.status_code, 201)
        self.assertEqual(signup_resp.data['email'], 'newuser@example.com')
        
        # Now try to log in with the new user
        login_resp = client.post(
            reverse('login'),
            {
                'email': 'newuser@example.com',
                'password': 'NewPass123!',
            },
            format='json'
        )
        
        self.assertEqual(login_resp.status_code, 200)
        self.assertIn('accessToken', login_resp.data)
        self.assertIn('refreshToken', login_resp.data)
        self.assertEqual(login_resp.data['user']['email'], 'newuser@example.com')

    def test_login_case_insensitive_email(self):
        """Test that login works with different email cases."""
        client = APIClient()
        
        # Sign up with lowercase email
        signup_resp = client.post(
            reverse('signup'),
            {
                'email': 'casetest@example.com',
                'password': 'CasePass123!',
                'firstName': 'Case',
                'lastName': 'Test',
            },
            format='json'
        )
        
        self.assertEqual(signup_resp.status_code, 201)
        
        # Try to log in with uppercase email
        login_resp = client.post(
            reverse('login'),
            {
                'email': 'CASETEST@EXAMPLE.COM',
                'password': 'CasePass123!',
            },
            format='json'
        )
        
        self.assertEqual(login_resp.status_code, 200)
        self.assertIn('accessToken', login_resp.data)

class UserProfileTests(TestCase):
    def setUp(self):
        role, _ = Role.objects.get_or_create(
            role_name='User',
            defaults={'description': 'default', 'permissions': ''}
        )
        self.user = User.objects.create_user(
            username='alice@example.com',
            email='alice@example.com',
            password='secret123',
            first_name='Alice',
            last_name='Tester',
            role=role,
        )

    def test_get_profile(self):
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.get(reverse('me'))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['email'], self.user.email)

    def test_patch_profile_updates_allowed_fields(self):
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        payload = {
            'firstName': 'Alicia',
            'lastName': 'Updated',
            'email': 'alicia@example.com',
        }
        resp = client.patch(reverse('me'), payload, format='json')

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['firstName'], 'Alicia')
        self.assertEqual(resp.data['lastName'], 'Updated')
        self.assertEqual(resp.data['email'], 'alicia@example.com')

        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Alicia')
        self.assertEqual(self.user.last_name, 'Updated')
        self.assertEqual(self.user.email, 'alicia@example.com')
        self.assertEqual(self.user.username, 'alicia@example.com')

    def test_patch_profile_rejects_non_editable_fields(self):
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        resp = client.patch(reverse('me'), {'role': 'Admin'}, format='json')

        self.assertEqual(resp.status_code, 400)
        self.assertIn('fields', resp.data)
        self.assertIn('role', resp.data['fields'])


class DashboardEndpointTests(APITestCase):
    """Tests for GET /api/dashboard/me endpoint."""

    def setUp(self):
        # Create role and user
        self.role, _ = Role.objects.get_or_create(
            role_name='User',
            defaults={'description': 'default', 'permissions': ''}
        )
        self.company = Company.objects.create(name='Test Corp', location='Test City')
        self.user = User.objects.create_user(
            username='dashboard@example.com',
            email='dashboard@example.com',
            password='testpass123',
            first_name='Dashboard',
            last_name='User',
            role=self.role,
            company=self.company,
        )
        
        # Create test data
        self.test1 = TestModel.objects.create(
            title='Python Basics',
            description='Test description',
            score=85.5,
            date_taken=timezone.now() - timedelta(days=2),
            user_id=self.user,
        )
        self.test2 = TestModel.objects.create(
            title='Advanced Python',
            description='Test description',
            score=92.0,
            date_taken=timezone.now() - timedelta(days=1),
            user_id=self.user,
        )
        
        # Create assignments
        self.assignment_pending = Assignment.objects.create(
            user=self.user,
            company_id=self.company,
            test_id=self.test1,
            due_date=timezone.now() + timedelta(days=5),
            start_date=timezone.now(),
        )
        self.assignment_overdue = Assignment.objects.create(
            user=self.user,
            company_id=self.company,
            test_id=self.test2,
            due_date=timezone.now() - timedelta(days=3),
            start_date=timezone.now() - timedelta(days=10),
        )
        
        # Create lessons
        self.lesson1 = Lesson.objects.create(
            title='Intro to Variables',
            score=88.0,
            user_id=self.user,
            questions='[]',
            lesson_material='Material here',
            completed_at=timezone.now() - timedelta(days=1),
        )

    def test_dashboard_me_success(self):
        """Test successful dashboard data retrieval."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.get(reverse('dashboard_me'))
        
        self.assertEqual(resp.status_code, 200)
        self.assertIn('user', resp.data)
        self.assertIn('assignments', resp.data)
        self.assertIn('tests', resp.data)
        self.assertIn('lessons', resp.data)
        
        # Check user data
        self.assertEqual(resp.data['user']['email'], self.user.email)
        self.assertEqual(resp.data['user']['firstName'], 'Dashboard')
        self.assertEqual(resp.data['user']['company'], 'Test Corp')
        
        # Check assignments data
        self.assertGreater(resp.data['assignments']['totalPending'], 0)
        self.assertGreater(resp.data['assignments']['totalOverdue'], 0)
        
        # Check tests data
        self.assertEqual(resp.data['tests']['totalCompleted'], 2)
        self.assertGreater(resp.data['tests']['averageScore'], 0)
        
        # Check lessons data
        self.assertEqual(resp.data['lessons']['totalCompleted'], 1)

    def test_dashboard_me_requires_authentication(self):
        """Test that dashboard endpoint requires authentication."""
        client = APIClient()
        resp = client.get(reverse('dashboard_me'))
        self.assertEqual(resp.status_code, 401)


class ChangePasswordEndpointTests(APITestCase):
    """Tests for PATCH /api/users/me/password endpoint."""

    def setUp(self):
        self.role, _ = Role.objects.get_or_create(
            role_name='User',
            defaults={'description': 'default', 'permissions': ''}
        )
        self.user = User.objects.create_user(
            username='password@example.com',
            email='password@example.com',
            password='OldPass123!',
            first_name='Password',
            last_name='Tester',
            role=self.role,
        )

    def test_change_password_success(self):
        """Test successful password change."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.patch(
            reverse('change_password'),
            {
                'currentPassword': 'OldPass123!',
                'newPassword': 'NewPass456!',
            },
            format='json'
        )
        
        self.assertEqual(resp.status_code, 200)
        self.assertIn('message', resp.data)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass456!'))
        self.assertFalse(self.user.check_password('OldPass123!'))

    def test_change_password_wrong_current(self):
        """Test password change with incorrect current password."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.patch(
            reverse('change_password'),
            {
                'currentPassword': 'WrongPass123!',
                'newPassword': 'NewPass456!',
            },
            format='json'
        )
        
        self.assertEqual(resp.status_code, 401)
        self.assertIn('error', resp.data)

    def test_change_password_same_as_current(self):
        """Test that new password cannot be same as current."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.patch(
            reverse('change_password'),
            {
                'currentPassword': 'OldPass123!',
                'newPassword': 'OldPass123!',
            },
            format='json'
        )
        
        self.assertEqual(resp.status_code, 400)
        self.assertIn('error', resp.data)

    def test_change_password_weak_password(self):
        """Test password change with weak password."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.patch(
            reverse('change_password'),
            {
                'currentPassword': 'OldPass123!',
                'newPassword': 'weak',
            },
            format='json'
        )
        
        self.assertEqual(resp.status_code, 400)
        self.assertIn('error', resp.data)

    def test_change_password_missing_fields(self):
        """Test password change with missing fields."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.patch(
            reverse('change_password'),
            {'currentPassword': 'OldPass123!'},
            format='json'
        )
        
        self.assertEqual(resp.status_code, 400)
        self.assertIn('fields', resp.data)

    def test_change_password_requires_authentication(self):
        """Test that password change requires authentication."""
        client = APIClient()
        resp = client.patch(
            reverse('change_password'),
            {
                'currentPassword': 'OldPass123!',
                'newPassword': 'NewPass456!',
            },
            format='json'
        )
        self.assertEqual(resp.status_code, 401)


class LearningModulesEndpointTests(APITestCase):
    """Tests for GET /api/learning/modules endpoint."""

    def setUp(self):
        # Create role and user
        self.role, _ = Role.objects.get_or_create(
            role_name='User',
            defaults={'description': 'default', 'permissions': ''}
        )
        self.user = User.objects.create_user(
            username='learning@example.com',
            email='learning@example.com',
            password='testpass123',
            first_name='Learning',
            last_name='User',
            role=self.role,
        )
        
        # Create modules
        self.module1 = Module.objects.create(
            title='Python Fundamentals',
            description='Learn Python basics',
            difficulty_level='beginner',
            estimated_duration=120,
            is_published=True,
        )
        self.module2 = Module.objects.create(
            title='Advanced Python',
            description='Advanced Python topics',
            difficulty_level='advanced',
            estimated_duration=180,
            is_published=True,
        )
        self.module3 = Module.objects.create(
            title='Unpublished Module',
            description='This should not appear',
            difficulty_level='intermediate',
            estimated_duration=90,
            is_published=False,
        )
        
        # Create lessons for module1
        self.lesson1 = Lesson.objects.create(
            module=self.module1,
            title='Variables and Data Types',
            score=90.0,
            user_id=self.user,
            questions='[]',
            lesson_material='Material',
            completed_at=timezone.now() - timedelta(days=2),
        )
        self.lesson2 = Lesson.objects.create(
            module=self.module1,
            title='Control Flow',
            score=85.0,
            user_id=self.user,
            questions='[]',
            lesson_material='Material',
            completed_at=timezone.now() - timedelta(days=1),
        )
        
        # Create incomplete lesson for module1
        self.lesson3 = Lesson.objects.create(
            module=self.module1,
            title='Functions',
            user_id=self.user,
            questions='[]',
            lesson_material='Material',
            completed_at=None,
        )

    def test_learning_modules_scope_me(self):
        """Test learning modules with scope=me."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.get(reverse('learning_modules'), {'scope': 'me'})
        
        self.assertEqual(resp.status_code, 200)
        self.assertIn('modules', resp.data)
        self.assertIn('totalModules', resp.data)
        self.assertEqual(resp.data['scope'], 'me')
        
        # Should only return published modules
        self.assertEqual(resp.data['totalModules'], 2)
        
        # Check module structure with progress
        module = resp.data['modules'][0]
        self.assertIn('moduleId', module)
        self.assertIn('title', module)
        self.assertIn('description', module)
        self.assertIn('difficultyLevel', module)
        self.assertIn('estimatedDuration', module)
        self.assertIn('totalLessons', module)
        self.assertIn('progress', module)
        self.assertIn('isStarted', module)
        self.assertIn('isCompleted', module)
        
        # Check progress data for module1
        if module['title'] == 'Python Fundamentals':
            self.assertEqual(module['progress']['completedLessons'], 2)
            self.assertEqual(module['progress']['totalLessons'], 3)
            self.assertGreater(module['progress']['progressPercentage'], 0)
            self.assertIsNotNone(module['progress']['averageScore'])
            self.assertTrue(module['isStarted'])
            self.assertFalse(module['isCompleted'])

    def test_learning_modules_scope_all(self):
        """Test learning modules with scope=all."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.get(reverse('learning_modules'), {'scope': 'all'})
        
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['scope'], 'all')
        
        # Should only return published modules
        self.assertEqual(resp.data['totalModules'], 2)
        
        # Check that progress data is NOT included
        module = resp.data['modules'][0]
        self.assertNotIn('progress', module)
        self.assertNotIn('isStarted', module)
        self.assertNotIn('isCompleted', module)

    def test_learning_modules_default_scope(self):
        """Test learning modules without scope parameter (defaults to 'all')."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.get(reverse('learning_modules'))
        
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['scope'], 'all')

    def test_learning_modules_requires_authentication(self):
        """Test that learning modules endpoint requires authentication."""
        client = APIClient()
        resp = client.get(reverse('learning_modules'), {'scope': 'me'})
        self.assertEqual(resp.status_code, 401)

    def test_learning_modules_excludes_unpublished(self):
        """Test that unpublished modules are not returned."""
        client = APIClient()
        token = RefreshToken.for_user(self.user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        resp = client.get(reverse('learning_modules'), {'scope': 'all'})
        
        self.assertEqual(resp.status_code, 200)
        
        # Verify unpublished module is not in results
        module_titles = [m['title'] for m in resp.data['modules']]
        self.assertNotIn('Unpublished Module', module_titles)
        self.assertIn('Python Fundamentals', module_titles)
        self.assertIn('Advanced Python', module_titles)
