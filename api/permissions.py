from rest_framework.permissions import BasePermission
from .models import Role


class IsAuthenticated(BasePermission):
    """Allow access only to authenticated users"""
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsManager(BasePermission):
    """Allow access only to manager role users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'role'):
            return False
        return request.user.role.role_name == Role.MANAGER


class IsEmployee(BasePermission):
    """Allow access only to employee role users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'role'):
            return False
        return request.user.role.role_name == Role.EMPLOYEE


class CanManageCompanyUsers(BasePermission):
    """Allow managers to add, remove, and update users in their company"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'role'):
            return False
        return request.user.role.role_name == Role.MANAGER and request.user.role.has_permission('change_user')
    
    def has_object_permission(self, request, view, obj):
        # Manager can only manage users in their own company
        if not hasattr(request.user, 'company'):
            return False
        return obj.company == request.user.company


class CanUpdateOwnAccount(BasePermission):
    """Allow users to update only their own account"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True
    
    def has_object_permission(self, request, view, obj):
        # Users can only update their own account
        return obj.user_id == request.user.user_id


class CanAddUsers(BasePermission):
    """Allow managers to add users to their company"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'role'):
            return False
        return request.user.role.role_name == Role.MANAGER and request.user.role.has_permission('add_user')


class CanDeleteUsers(BasePermission):
    """Allow managers to delete users from their company"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'role'):
            return False
        return request.user.role.role_name == Role.MANAGER and request.user.role.has_permission('delete_user')
