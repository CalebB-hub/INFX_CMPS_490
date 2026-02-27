from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import Role

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
    Body: email, password, firstName, lastName.
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
    try:
        validate_password(password)
    except DjangoValidationError as e:
        return Response(
            {'error': 'Invalid password.', 'details': list(e.messages)},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Default role for new signups (required by User model)
    default_role, _ = Role.objects.get_or_create(
        role_name='User',
        defaults={'description': 'Default user role', 'permissions': ''}
    )

    # Create user (password is hashed by create_user)
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=default_role,
        company=None,
    )

    return Response(
        {
            'id': user.user_id,
            'email': user.email,
            'message': 'User created successfully',
        },
        status=status.HTTP_201_CREATED,
    )

