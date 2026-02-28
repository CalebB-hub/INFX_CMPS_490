from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    
    # Manager endpoints
    path('users/add/', views.add_user, name='add_user'),
    path('users/<int:user_id>/update/', views.update_user, name='update_user'),
    path('users/<int:user_id>/delete/', views.delete_user, name='delete_user'),
    
    # Employee endpoints
    path('account/', views.get_own_account, name='get_own_account'),
    path('account/update/', views.update_own_account, name='update_own_account'),
]
