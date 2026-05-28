"""URL patterns for users app."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    UpdatePreferencesView,
    ChangePasswordView,
    UserStatsView,
    UpgradeSubscriptionView,
)

app_name = 'users'

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Profile
    path('me/', ProfileView.as_view(), name='profile'),
    path('preferences/', UpdatePreferencesView.as_view(), name='preferences'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Stats & Subscription
    path('stats/', UserStatsView.as_view(), name='stats'),
    path('upgrade/', UpgradeSubscriptionView.as_view(), name='upgrade'),
]
