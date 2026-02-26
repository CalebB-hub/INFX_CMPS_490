from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
import secrets

# Simple in-memory store for reset tokens (dev only)
RESET_TOKENS = {}

User = get_user_model()


@api_view(['GET'])
def hello_world(request):
    """Simple API endpoint that returns a greeting."""
    return Response({
        'message': 'Hello from Django!',
        'status': 'success'
    })


@api_view(['POST'])
def api_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'detail': 'username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    # Return a simple token placeholder for dev
    token = f"dev-token-{user.username}"
    return Response({'token': token, 'user': {'username': user.username, 'name': f"{user.first_name} {user.last_name}".strip(), 'role': getattr(user, 'role', None)}})


@api_view(['POST'])
def api_forgot_password(request):
    identifier = request.data.get('email') or request.data.get('username')
    if not identifier:
        return Response({'detail': 'email or username required'}, status=status.HTTP_400_BAD_REQUEST)

    # try to find by username then email
    try:
        user = User.objects.get(username=identifier)
    except User.DoesNotExist:
        try:
            user = User.objects.get(email=identifier)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    token = secrets.token_urlsafe(16)
    RESET_TOKENS[token] = {'username': user.username, 'created': timezone.now()}

    # In a real app you would email the tokenized link. For development we return it.
    return Response({'success': True, 'message': 'Reset link generated', 'token': token})


@api_view(['POST'])
def api_reset_password(request):
    token = request.data.get('token')
    new_password = request.data.get('password')
    if not token or not new_password:
        return Response({'detail': 'token and password required'}, status=status.HTTP_400_BAD_REQUEST)

    entry = RESET_TOKENS.get(token)
    if not entry:
        return Response({'detail': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=entry['username'])
    except User.DoesNotExist:
        return Response({'detail': 'User not found for token'}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(new_password)
    user.save()
    # consume token
    del RESET_TOKENS[token]
    return Response({'success': True, 'message': 'Password updated'})

