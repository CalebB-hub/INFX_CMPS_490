from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import User, Role
from .permissions import IsManager, CanUpdateOwnAccount, CanManageCompanyUsers, CanAddUsers, CanDeleteUsers


@api_view(['GET'])
def hello_world(request):
    """Simple API endpoint that returns a greeting."""
    return Response({
        'message': 'Hello from Django!',
        'status': 'success'
    })


# Manager endpoints - manage users in their company
@api_view(['POST'])
@permission_classes([CanAddUsers])
def add_user(request):
    """
    Managers can add new users to their company.
    Body: {
        "username": "string",
        "email": "string",
        "password": "string",
        "first_name": "string",
        "last_name": "string",
        "role": "manager|employee"
    }
    """
    try:
        # Get manager's company
        manager_company = request.user.company
        if not manager_company:
            return Response(
                {'error': 'Manager does not have a company assigned'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new user
        user = User.objects.create_user(
            username=request.data.get('username'),
            email=request.data.get('email'),
            password=request.data.get('password'),
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
            company=manager_company,
            role=Role.objects.get(role_name=request.data.get('role', Role.EMPLOYEE))
        )
        
        return Response({
            'message': 'User created successfully',
            'user_id': user.user_id,
            'username': user.username
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([CanManageCompanyUsers])
def update_user(request, user_id):
    """
    Managers can update users in their company.
    """
    try:
        user = User.objects.get(user_id=user_id)
        
        # Verify user belongs to manager's company
        if user.company != request.user.company:
            return Response(
                {'error': 'Cannot update users outside your company'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        if 'role' in request.data:
            user.role = Role.objects.get(role_name=request.data['role'])
        
        user.save()
        
        return Response({
            'message': 'User updated successfully',
            'user_id': user.user_id
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([CanDeleteUsers])
def delete_user(request, user_id):
    """
    Managers can delete users from their company.
    """
    try:
        user = User.objects.get(user_id=user_id)
        
        # Verify user belongs to manager's company
        if user.company != request.user.company:
            return Response(
                {'error': 'Cannot delete users outside your company'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        username = user.username
        user.delete()
        
        return Response({
            'message': f'User {username} deleted successfully'
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Employee endpoints - update own account
@api_view(['PUT', 'PATCH'])
@permission_classes([CanUpdateOwnAccount])
def update_own_account(request):
    """
    Employees can update only their own account.
    Body: {
        "first_name": "string",
        "last_name": "string",
        "email": "string"
    }
    """
    try:
        user = request.user
        
        # Update fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        
        user.save()
        
        return Response({
            'message': 'Your account updated successfully',
            'user_id': user.user_id
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([CanUpdateOwnAccount])
def get_own_account(request):
    """
    Get authenticated user's account details.
    """
    user = request.user
    return Response({
        'user_id': user.user_id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role.get_role_name_display(),
        'company': user.company.name if user.company else None
    })

