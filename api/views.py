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
import re
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
        parsed_questions = _safe_json_loads(lesson.questions)
        lessons_list.append(
            {
                'lessonId': lesson.lesson_id,
                'moduleId': 1,
                'moduleTitle': 'Lessons',
                'title': lesson.title,
                'lessonMaterial': lesson.lesson_material,
                'totalQuestions': len(parsed_questions) if isinstance(parsed_questions, list) else 0,
                'score': float(lesson_score.score) if lesson_score else None,
                'completedAt': lesson_score.updated_at.isoformat() if lesson_score else None,
            }
        )

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
    questions = _safe_json_loads(lesson.questions)
    choices = _safe_json_loads(lesson.choices)
    answers = _safe_json_loads(lesson.answers)

    return Response(
        {
            'lessonId': lesson.lesson_id,
            'moduleId': 1,
            'moduleTitle': 'Lessons',
            'title': lesson.title,
            'lessonMaterial': lesson.lesson_material,
            'questions': questions if isinstance(questions, list) else [],
            'choices': choices if isinstance(choices, list) else [],
            'answers': answers if isinstance(answers, list) else [],
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
    questions = _safe_json_loads(lesson.questions)
    choices = _safe_json_loads(lesson.choices)
    answers = _safe_json_loads(lesson.answers)

    return Response(
        {
            'lessonId': lesson.lesson_id,
            'moduleId': 1,
            'moduleTitle': 'Lessons',
            'title': lesson.title,
            'lessonMaterial': lesson.lesson_material,
            'questions': questions if isinstance(questions, list) else [],
            'choices': choices if isinstance(choices, list) else [],
            'answers': answers if isinstance(answers, list) else [],
            'score': float(lesson_score.score) if lesson_score else None,
            'completedAt': lesson_score.updated_at.isoformat() if lesson_score else None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def learning_lesson_scores(request):
    """
    Return all lesson scores for the authenticated user.
    """
    scores = (
        LessonScore.objects
        .filter(user=request.user)
        .select_related('lesson')
        .order_by('-updated_at')
    )

    payload = [
        {
            'lessonScoreId': score.lesson_score_id,
            'lessonId': score.lesson.lesson_id,
            'lessonTitle': score.lesson.title,
            'score': float(score.score),
            'createdAt': score.created_at.isoformat(),
            'updatedAt': score.updated_at.isoformat(),
        }
        for score in scores
    ]

    return Response(
        {
            'scores': payload,
            'totalScores': len(payload),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def learning_lesson_score_submit(request, lesson_id):
    """
    Record a lesson score attempt for the authenticated user.
    Keeps only the user's best score for each lesson.
    Body: { "score": number }
    """
    lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
    body = request.data if getattr(request, 'data', None) is not None else {}
    if not isinstance(body, dict):
        return Response(
            {'error': 'Request body must be JSON object.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    score = body.get('score', None)
    if score is None:
        return Response(
            {'error': 'score is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        score_value = float(score)
    except Exception:
        return Response(
            {'error': 'score must be a number.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if score_value < 0:
        return Response(
            {'error': 'score must be greater than or equal to 0.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    lesson_score, was_updated = LessonScore.record_attempt(
        user=request.user,
        lesson=lesson,
        score=score_value,
    )

    return Response(
        {
            'lessonScoreId': lesson_score.lesson_score_id,
            'lessonId': lesson.lesson_id,
            'score': float(lesson_score.score),
            'completedAt': lesson_score.updated_at.isoformat(),
            'wasUpdated': was_updated,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def learning_tests(request):
    """
    Returns tests with email content and multiple-choice questions
    for the current user.
    """
    tests = Test.objects.filter(user_id=request.user).order_by('-date_taken')
    payload = []

    for test in tests:
        questions = Question.objects.filter(test_id=test).order_by('question_id')
        questions_payload = [
            {
                'questionId': q.question_id,
                'questionText': q.question_text,
                'answer': q.answer,
            }
            for q in questions
        ]

        payload.append(
            {
                'testId': test.test_id,
                'title': test.title,
                'description': test.description,
                'dateTaken': test.date_taken.isoformat() if test.date_taken else None,
                'score': float(test.score) if test.score is not None else None,
                'questions': questions_payload,
            }
        )

    return Response(
        {
            'tests': payload,
            'totalTests': len(payload),
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


def _normalize_quiz_questions(raw_questions):
    """Normalize various quiz question formats to the API shape."""
    if not isinstance(raw_questions, list):
        return []

    normalized = []
    for idx, item in enumerate(raw_questions):
        if not isinstance(item, dict):
            continue

        prompt = str(item.get('prompt') or item.get('question') or '').strip()
        options = item.get('options', item.get('choices', []))
        if not prompt or not isinstance(options, list) or len(options) < 2:
            continue

        answer = item.get('correctIndex', item.get('answer', None))
        correct_index = None
        if isinstance(answer, int) and 0 <= answer < len(options):
            correct_index = answer
        elif str(answer).isdigit():
            answer_index = int(answer)
            if 0 <= answer_index < len(options):
                correct_index = answer_index
        elif isinstance(answer, str):
            try:
                correct_index = [str(opt) for opt in options].index(answer)
            except ValueError:
                correct_index = None

        normalized.append(
            {
                'id': str(item.get('id', f'{idx + 1}')),
                'prompt': prompt,
                'options': [str(opt) for opt in options],
                'correctIndex': correct_index,
            }
        )

    return normalized


def _extract_quiz_from_lesson_material(lesson_material):
    """
    Extract quiz payload from lesson_material, leaving lesson prose behind.
    """
    parsed = _safe_json_loads(lesson_material)

    if isinstance(parsed, dict):
        quiz_obj = parsed.get('quiz') if isinstance(parsed.get('quiz'), dict) else parsed
        questions = _normalize_quiz_questions(quiz_obj.get('questions'))
        if questions:
            return {
                'title': str(quiz_obj.get('title') or '').strip() or None,
                'questions': questions,
            }

    if isinstance(lesson_material, str):
        # Support quiz JSON embedded in a fenced code block inside the lesson text.
        blocks = re.findall(r'```(?:json)?\s*([\s\S]*?)\s*```', lesson_material, flags=re.IGNORECASE)
        for block in blocks:
            candidate = _safe_json_loads(block)
            if not isinstance(candidate, dict):
                continue
            quiz_obj = candidate.get('quiz') if isinstance(candidate.get('quiz'), dict) else candidate
            questions = _normalize_quiz_questions(quiz_obj.get('questions'))
            if questions:
                return {
                    'title': str(quiz_obj.get('title') or '').strip() or None,
                    'questions': questions,
                }

    return None


def _serialize_question_for_frontend(question, include_answer=False):
    options = _safe_json_loads(question.response)
    payload = {
        'questionId': question.question_id,
        'questionText': question.question_text,
        'questionType': question.question_type,
        'options': options if isinstance(options, list) else [],
        'score': float(question.score) if question.score is not None else None,
    }

    if include_answer:
        if str(question.answer).isdigit():
            payload['correctIndex'] = int(question.answer)
        else:
            payload['answer'] = question.answer

    return payload


def _get_accessible_test_or_404(request, test_id):
    test = get_object_or_404(Test, test_id=test_id)
    if test.user_id_id is not None and test.user_id_id != request.user.user_id:
        return None
    return test


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_detail(request, test_id):
    """
    Return one test and its questions for the authenticated user.
    Also allows reading shared template tests where user_id is null.
    """
    test = _get_accessible_test_or_404(request, test_id)
    if test is None:
        return Response({'error': 'Test not found.'}, status=status.HTTP_404_NOT_FOUND)

    meta = _safe_json_loads(test.description) or {}
    questions = Question.objects.filter(test_id=test).order_by('question_id')

    return Response(
        {
            'testId': test.test_id,
            'title': test.title,
            'description': test.description,
            'metadata': meta if isinstance(meta, dict) else {},
            'dateTaken': test.date_taken.isoformat() if test.date_taken else None,
            'score': float(test.score) if test.score is not None else None,
            'questions': [
                _serialize_question_for_frontend(
                    question,
                    include_answer=(test.user_id_id is None),
                )
                for question in questions
            ],
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_questions(request, test_id):
    """
    Return only questions for a specific test.
    """
    test = _get_accessible_test_or_404(request, test_id)
    if test is None:
        return Response({'error': 'Test not found.'}, status=status.HTTP_404_NOT_FOUND)

    questions = Question.objects.filter(test_id=test).order_by('question_id')
    return Response(
        {
            'testId': test.test_id,
            'questions': [
                _serialize_question_for_frontend(
                    question,
                    include_answer=(test.user_id_id is None),
                )
                for question in questions
            ],
            'totalQuestions': questions.count(),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def quizzes(request):
    """
    GET: return all quiz templates.
    POST: create a quiz template.
    """
    if request.method == 'GET':
        lessons = Lesson.objects.all().order_by('lesson_id')

        payload = []
        for lesson in lessons:
            questions = _safe_json_loads(lesson.questions)
            choices = _safe_json_loads(lesson.choices)
            answers = _safe_json_loads(lesson.answers)

            if not isinstance(questions, list) or not isinstance(choices, list):
                continue

            question_payload = []
            for idx, (q_text, q_choices) in enumerate(zip(questions, choices)):
                answer_text = answers[idx] if isinstance(answers, list) and idx < len(answers) else None
                correct_index = None
                if answer_text is not None and isinstance(q_choices, list):
                    try:
                        correct_index = [str(opt) for opt in q_choices].index(str(answer_text))
                    except ValueError:
                        correct_index = None

                question_payload.append(
                    {
                        'id': str(idx + 1),
                        'prompt': str(q_text),
                        'options': [str(opt) for opt in q_choices] if isinstance(q_choices, list) else [],
                        'correctIndex': correct_index,
                    }
                )

            if not question_payload:
                continue

            payload.append(
                {
                    'id': str(lesson.lesson_id),
                    'lessonId': lesson.lesson_id,
                    'title': lesson.title,
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
