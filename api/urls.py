from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('auth/signup/', views.signup, name='signup'),
    path('auth/password-policy/', views.password_policy, name='password_policy'),
    path('auth/login/', views.login, name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.logout, name='logout'),
    path('users/me', views.me, name='me'),
    path('users/me/password', views.change_password, name='change_password'),
    path('dashboard/me', views.dashboard_me, name='dashboard_me'),
    path('learning/modules', views.learning_modules, name='learning_modules'),
    path('learning/lessons', views.learning_lessons, name='learning_lessons'),
    path('learning/lessons/<int:lesson_id>', views.learning_lesson_detail, name='learning_lesson_detail'),
    path('generate-content/', views.generate_content, name='generate_content'),
]
