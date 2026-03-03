from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('auth/signup/', views.signup, name='signup'),
    path('auth/password-policy/', views.password_policy, name='password_policy'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('users/me', views.me, name='me'),
]
