from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('auth/login/', views.api_login, name='api_login'),
    path('auth/forgot-password/', views.api_forgot_password, name='api_forgot_password'),
    path('auth/reset-password/', views.api_reset_password, name='api_reset_password'),
]
