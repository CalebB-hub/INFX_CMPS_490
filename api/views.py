from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import Avg, Count, Q
from django.utils import timezone

import json
from datetime import datetime, timezone as dt_timezone

from .models import Role, Company, Assignment, Test, Lesson, Question, LessonScore
from .services.ai_services import _generate_emails, _clean_response

User = get_user_model()


@api_view(['GET'])
def hello_world(request):
    """Simple API endpoint that returns a greeting."""
    return Response({
        'message': 'Hello from Django!',
        'status': 'success'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """
    User registration. No auth required.
    Body: email, password, firstName, lastName, optional companyName.
    Returns 201 with id, email, message. Returns 409 if email exists.
    """
    # Parse and validate required fields
    required = ('email', 'password', 'firstName', 'lastName')
    body = request.data if getattr(request, 'data', None) is not None else {}
    if not isinstance(body, dict):
        return Response(
            {'error': 'Request body must be JSON object.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    missing = [f for f in required if not (body.get(f) and str(body.get(f)).strip())]
    if missing:
        return Response(
            {'error': 'Missing or empty required fields.', 'fields': missing},
            status=status.HTTP_400_BAD_REQUEST
        )

    email = str(body['email']).strip().lower()
    password = str(body['password'])
    first_name = str(body['firstName']).strip()
    last_name = str(body['lastName']).strip()
    company_name = str(body.get('companyName', '')).strip()

    # Basic email format check
    if '@' not in email or '.' not in email.split('@')[-1]:
        return Response(
            {'error': 'Invalid email format.', 'fields': ['email']},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 409 if email already exists
    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {'error': 'A user with this email already exists.'},
            status=status.HTTP_409_CONFLICT
        )

    # Validate password (Django validators; password will be hashed on create)
    # Pass a temp user so UserAttributeSimilarityValidator can compare against name/email
    try:
        temp_user = User(username=email, email=email, first_name=first_name, last_name=last_name)
        validate_password(password, temp_user)
    except DjangoValidationError as e:
        return Response(
            {'error': 'Invalid password.', 'details': list(e.messages)},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Organization signups include companyName and get organization role + company.
    is_organization_signup = bool(company_name)

    if is_organization_signup:
        user_role, _ = Role.objects.get_or_create(
            role_name='Organization',
            defaults={'description': 'Organization account', 'permissions': ''}
        )
        company, _ = Company.objects.get_or_create(
            name=company_name,
            defaults={'location': 'N/A'}
        )
    else:
        user_role, _ = Role.objects.get_or_create(
            role_name='User',
            defaults={'description': 'Default user role', 'permissions': ''}
        )
        company = None

    # Create user (password is hashed by create_user)
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=user_role,
        company=company,
    )

    return Response(
        {
            'id': user.user_id,
            'email': user.email,
            'company': user.company.name if user.company else None,
            'role': user.role.role_name if user.role else None,
            'message': 'User created successfully',
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def password_policy(request):
    """
    Return password policy used by backend validators for frontend guidance.
    """
    policy = getattr(settings, "PASSWORD_POLICY", {})
    return Response(
        {
            "minLength": policy.get("MIN_LENGTH", 8),
            "requireUppercase": policy.get("REQUIRE_UPPERCASE", True),
            "requireNumber": policy.get("REQUIRE_NUMBER", True),
            "requireSpecialChar": policy.get("REQUIRE_SPECIAL_CHAR", True),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate user and return JWT access/refresh tokens.
    Expected body: { "email": string, "password": string }
    """
    body = request.data if getattr(request, 'data', None) is not None else {}
    if not isinstance(body, dict):
        return Response(
            {'error': 'Request body must be JSON object.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = str(body.get('email', '')).strip().lower()
    password = str(body.get('password', ''))

    if not email or not password:
        missing = []
        if not email:
            missing.append('email')
        if not password:
            missing.append('password')
        return Response(
            {'error': 'Missing required fields.', 'fields': missing},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Attempt authentication using email as username (we store username=email for signups)
    user = authenticate(request, username=email, password=password)
    
    # If authentication fails with the lowercased email, try finding the user by email
    # and check password directly (handles case sensitivity issues)
    if user is None:
        try:
            user = User.objects.get(email__iexact=email)
            if not user.check_password(password):
                user = None
        except User.DoesNotExist:
            user = None
    
    if user is None:
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Issue JWT access/refresh token pair
    refresh = RefreshToken.for_user(user)

    return Response(
        {
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': {
                'id': str(user.user_id),
                'email': user.email,
            },
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Blacklist the refresh token supplied by the client.

    Expected body: { "refreshToken": "<the refresh token string>" }
    Returns 204 on success, 400 if the token in missing/invalid.
    """
    body = request.data if getattr(request, 'data', None) is not None else {}
    refresh_token = body.get('refreshToken')

    if not refresh_token:
        return Response(
            {'error': 'refreshToken is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    try:
        # this will raise if the token is invalid or already blacklisted
        RefreshToken(refresh_token).blacklist()
    except Exception:
        return Response(
            {'error': 'Invalid refresh token.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Returns the current user's profile information (GET)
    or partially updates editable profile fields (PATCH).
    """
    user = request.user

    if request.method == 'PATCH':
        body = request.data if getattr(request, 'data', None) is not None else {}
        if not isinstance(body, dict):
            return Response(
                {'error': 'Request body must be JSON object.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        editable_fields = {'firstName', 'lastName', 'email'}
        provided_fields = set(body.keys())
        invalid_fields = sorted(list(provided_fields - editable_fields))

        if invalid_fields:
            return Response(
                {
                    'error': 'One or more fields are not editable.',
                    'fields': invalid_fields,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        has_changes = False

        if 'firstName' in body:
            first_name = str(body.get('firstName', '')).strip()
            if not first_name:
                return Response(
                    {'error': 'firstName cannot be empty.', 'fields': ['firstName']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if first_name != user.first_name:
                user.first_name = first_name
                has_changes = True

        if 'lastName' in body:
            last_name = str(body.get('lastName', '')).strip()
            if not last_name:
                return Response(
                    {'error': 'lastName cannot be empty.', 'fields': ['lastName']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if last_name != user.last_name:
                user.last_name = last_name
                has_changes = True

        if 'email' in body:
            email = str(body.get('email', '')).strip().lower()
            if not email:
                return Response(
                    {'error': 'email cannot be empty.', 'fields': ['email']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if '@' not in email or '.' not in email.split('@')[-1]:
                return Response(
                    {'error': 'Invalid email format.', 'fields': ['email']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if User.objects.filter(email__iexact=email).exclude(user_id=user.user_id).exists():
                return Response(
                    {'error': 'A user with this email already exists.'},
                    status=status.HTTP_409_CONFLICT,
                )
            if email != user.email:
                user.email = email
                user.username = email
                has_changes = True

        if not has_changes:
            return Response(
                {'error': 'No valid changes provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.save()

    return Response(
        {
            'id': str(user.user_id),
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'company': user.company.name if user.company else None,
            'role': user.role.role_name if user.role else None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change the authenticated user's password.
    
    Required body:
    - currentPassword: The user's current password for verification
    - newPassword: The new password to set
    
    Returns 200 on success, 400 for validation errors, 401 for incorrect current password.
    """
    user = request.user
    body = request.data if getattr(request, 'data', None) is not None else {}
    
    # Validate required fields
    current_password = body.get('currentPassword')
    new_password = body.get('newPassword')
    
    if not current_password or not new_password:
        missing = []
        if not current_password:
            missing.append('currentPassword')
        if not new_password:
            missing.append('newPassword')
        return Response(
            {'error': 'Missing required fields.', 'fields': missing},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Verify current password
    if not user.check_password(current_password):
        return Response(
            {'error': 'Current password is incorrect.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    
    # Validate new password against Django password validators
    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as e:
        return Response(
            {'error': 'New password does not meet requirements.', 'details': e.messages},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Check if new password is same as current
    if user.check_password(new_password):
        return Response(
            {'error': 'New password must be different from current password.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response(
        {'message': 'Password changed successfully.'},
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_me(request):
    """
    Returns comprehensive dashboard data for the authenticated user including:
    - User profile information
    - Assignment statistics (pending, completed, overdue)
    - Test performance metrics
    - Recent activity
    """
    user = request.user
    now = timezone.now()
    
    # Get assignments
    assignments = Assignment.objects.filter(user=user)
    
    # An assignment is pending if it's not past due
    pending_assignments = assignments.filter(
        due_date__gte=now
    ).order_by('due_date')[:5]
    
    # An assignment is overdue if it's past the due date
    overdue_assignments = assignments.filter(
        due_date__lt=now
    ).order_by('due_date')
    
    # Get test statistics
    user_tests = Test.objects.filter(user_id=user)
    test_stats = user_tests.aggregate(
        total_tests=Count('test_id'),
        average_score=Avg('score')
    )
    
    # Get recent tests
    recent_tests = user_tests.order_by('-date_taken')[:5].values(
        'test_id', 'title', 'score', 'date_taken'
    )
    
    # Get lessons progress
    user_lessons = Lesson.objects.filter(user_id=user)
    lesson_stats = user_lessons.aggregate(
        total_lessons=Count('lesson_id'),
        average_score=Avg('score')
    )
    
    # Format pending assignments
    pending_list = [
        {
            'assignmentId': a.assignment_id,
            'testTitle': a.test_id.title if a.test_id else 'Untitled',
            'dueDate': a.due_date.isoformat(),
            'startDate': a.start_date.isoformat(),
        }
        for a in pending_assignments
    ]
    
    # Format overdue assignments
    overdue_list = [
        {
            'assignmentId': a.assignment_id,
            'testTitle': a.test_id.title if a.test_id else 'Untitled',
            'dueDate': a.due_date.isoformat(),
            'daysPastDue': (now - a.due_date).days,
        }
        for a in overdue_assignments
    ]
    
    # Format recent tests
    recent_tests_list = [
        {
            'testId': t['test_id'],
            'title': t['title'],
            'score': float(t['score']) if t['score'] else 0,
            'dateTaken': t['date_taken'].isoformat(),
        }
        for t in recent_tests
    ]
    
    return Response(
        {
            'user': {
                'id': str(user.user_id),
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'role': user.role.role_name if user.role else None,
                'company': user.company.name if user.company else None,
            },
            'assignments': {
                'pending': pending_list,
                'overdue': overdue_list,
                'totalPending': pending_assignments.count(),
                'totalOverdue': overdue_assignments.count(),
            },
            'tests': {
                'totalCompleted': test_stats['total_tests'] or 0,
                'averageScore': float(test_stats['average_score']) if test_stats['average_score'] else 0,
                'recentTests': recent_tests_list,
            },
            'lessons': {
                'totalCompleted': lesson_stats['total_lessons'] or 0,
                'averageScore': float(lesson_stats['average_score']) if lesson_stats['average_score'] else 0,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def learning_lessons(request):
    """
    Returns all lessons along with the authenticated user's lesson progress.
    """
    lessons_query = Lesson.objects.all().order_by('lesson_id')
    score_map = {
        score.lesson_id: score
        for score in LessonScore.objects.filter(user=request.user, lesson__in=lessons_query)
    }
    lessons_list = []

    for lesson in lessons_query:
        lesson_score = score_map.get(lesson.lesson_id)
        lessons_list.append({
            'lessonId': lesson.lesson_id,
            'moduleId': 1,
            'moduleTitle': 'Lessons',
            'title': lesson.title,
            'lessonMaterial': lesson.lesson_material,
            'score': float(lesson_score.score) if lesson_score else None,
            'completedAt': lesson_score.updated_at.isoformat() if lesson_score else None,
        })

    return Response(
        {
            'lessons': lessons_list,
            'totalLessons': len(lessons_list),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def learning_lesson_detail(request, lesson_id):
    """
    Returns a single lesson plus the authenticated user's lesson progress.
    """
    lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
    lesson_score = LessonScore.objects.filter(user=request.user, lesson=lesson).first()

    return Response(
        {
            'lessonId': lesson.lesson_id,
            'moduleId': 1,
            'moduleTitle': 'Lessons',
            'title': lesson.title,
            'lessonMaterial': lesson.lesson_material,
            'questions': lesson.questions,
            'score': float(lesson_score.score) if lesson_score else None,
            'completedAt': lesson_score.updated_at.isoformat() if lesson_score else None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lesson_page_detail(request, lesson_id):
    """
    Dedicated endpoint for the Lessons page to fetch a single lesson.
    """
    lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
    lesson_score = LessonScore.objects.filter(user=request.user, lesson=lesson).first()

    return Response(
        {
            'lessonId': lesson.lesson_id,
            'moduleId': 1,
            'moduleTitle': 'Lessons',
            'title': lesson.title,
            'lessonMaterial': lesson.lesson_material,
            'questions': lesson.questions,
            'score': float(lesson_score.score) if lesson_score else None,
            'completedAt': lesson_score.updated_at.isoformat() if lesson_score else None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_test_emails(request):
    """
    Send a prompt to Gemini and return generated text.
    Body: { "prompt": string }
    """
    subject = request.data.get('subject')

    if not subject or not str(subject).strip():
        return Response(
            {'error': 'subject is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    try:
        emails = _clean_response(_generate_emails(str(subject).strip()))
        return Response({'emails': emails}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to generate emails: {str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )


def _safe_json_loads(value):
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def quizzes(request):
    """
    GET: return all quiz templates.
    POST: create a quiz template.
    """
    if request.method == 'GET':
        quizzes = (
            Test.objects.filter(user_id__isnull=True)
            .order_by('test_id')
        )

        payload = []
        for quiz in quizzes:
            meta = _safe_json_loads(quiz.description) or {}
            lesson_id = meta.get('lessonId') if isinstance(meta, dict) else None

            questions = Question.objects.filter(test_id=quiz).order_by('question_id')
            question_payload = []
            for q in questions:
                options = _safe_json_loads(q.response)
                question_payload.append(
                    {
                        'id': str(q.question_id),
                        'prompt': q.question_text,
                        'options': options if isinstance(options, list) else [],
                        'correctIndex': int(q.answer) if str(q.answer).isdigit() else None,
                    }
                )

            payload.append(
                {
                    'id': str(quiz.test_id),
                    'lessonId': lesson_id,
                    'title': quiz.title,
                    'questions': question_payload,
                }
            )

        return Response(payload, status=status.HTTP_200_OK)

    # POST
    body = request.data if getattr(request, 'data', None) else {}
    if not isinstance(body, dict):
        return Response({'error': 'Request body must be JSON object.'}, status=status.HTTP_400_BAD_REQUEST)

    title = str(body.get('title', '')).strip()
    lesson_id = body.get('lessonId', None)
    questions = body.get('questions', [])

    if not title:
        return Response({'error': 'title is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(questions, list) or len(questions) == 0:
        return Response({'error': 'questions must be a non-empty array.'}, status=status.HTTP_400_BAD_REQUEST)

    meta = {'lessonId': lesson_id} if lesson_id is not None else {}
    quiz = Test.objects.create(
        title=title,
        description=json.dumps(meta),
        score=0,
        date_taken=datetime.now(dt_timezone.utc),
        user_id=None,
    )

    created_questions = []
    for idx, q in enumerate(questions):
        if not isinstance(q, dict):
            return Response({'error': f'questions[{idx}] must be an object.'}, status=status.HTTP_400_BAD_REQUEST)

        prompt = str(q.get('prompt', '')).strip()
        options = q.get('options', [])
        correct_index = q.get('correctIndex', None)

        if not prompt:
            return Response({'error': f'questions[{idx}].prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(options, list) or len(options) < 2:
            return Response({'error': f'questions[{idx}].options must be an array with >= 2 items.'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(correct_index, int) or correct_index < 0 or correct_index >= len(options):
            return Response({'error': f'questions[{idx}].correctIndex must be a valid index into options.'}, status=status.HTTP_400_BAD_REQUEST)

        created = Question.objects.create(
            test_id=quiz,
            question_text=prompt,
            question_type='multiple_choice',
            answer=str(correct_index),
            response=json.dumps([str(o) for o in options]),
            score=1,
        )
        created_questions.append(str(created.question_id))

    return Response(
        {
            'id': str(quiz.test_id),
            'lessonId': lesson_id,
            'title': quiz.title,
            'questionIds': created_questions,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_post(request):
    """
    Create a Test attempt record for the authenticated user.

    Body:
    {
      "title": string,
      "description": string (optional),
      "score": number (optional, default 0)
    }
    """
    body = request.data if getattr(request, 'data', None) else {}
    if not isinstance(body, dict):
        return Response({'error': 'Request body must be JSON object.'}, status=status.HTTP_400_BAD_REQUEST)

    title = str(body.get('title', '')).strip()
    description = str(body.get('description', '')).strip()
    score = body.get('score', 0)

    if not title:
        return Response({'error': 'title is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        score_value = float(score)
    except Exception:
        return Response({'error': 'score must be a number.'}, status=status.HTTP_400_BAD_REQUEST)

    t = Test.objects.create(
        title=title,
        description=description,
        score=score_value,
        date_taken=datetime.now(dt_timezone.utc),
        user_id=request.user,
    )

    return Response(
        {
            'testId': str(t.test_id),
            'title': t.title,
            'score': float(t.score),
            'dateTaken': t.date_taken.isoformat(),
        },
        status=status.HTTP_201_CREATED,
    )
