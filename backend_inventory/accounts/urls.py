# accounts/urls.py
from django.urls import path
from .views import create_user, get_user_profile, list_users

urlpatterns = [
    path('me/', get_user_profile),
    path('create/', create_user),
    path('users/', list_users),
]
