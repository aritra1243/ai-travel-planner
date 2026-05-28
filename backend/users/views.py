"""Views for users app — registration, login, profile, preferences."""

import logging
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UpdatePreferencesSerializer,
    ChangePasswordSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


# ─── Helper: Generate Tokens ──────────────────────────────────────────────────

def get_tokens_for_user(user):
    """Generate access and refresh JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    refresh['name'] = user.name
    refresh['email'] = user.email
    refresh['subscription_type'] = user.subscription_type
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def user_response_data(user):
    """Return serialized user + tokens."""
    tokens = get_tokens_for_user(user)
    return {
        'user': UserSerializer(user).data,
        'tokens': tokens,
        'access': tokens['access'],
    }


# ─── Register ─────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    """POST /api/auth/register/ — Create new user account."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"New user registered: {user.email}")
            return Response(user_response_data(user), status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """POST /api/auth/login/ — Login and receive JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'No account found with this email.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Incorrect password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'This account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN
            )

        logger.info(f"User logged in: {user.email}")
        return Response(user_response_data(user), status=status.HTTP_200_OK)


# ─── Token Refresh ────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """POST /api/auth/logout/ — Blacklist the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'message': 'Logged out.'}, status=status.HTTP_200_OK)


# ─── Profile ──────────────────────────────────────────────────────────────────

class ProfileView(APIView):
    """GET /api/auth/me/ — Get current user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ─── Update Preferences ───────────────────────────────────────────────────────

class UpdatePreferencesView(APIView):
    """PUT /api/auth/preferences/ — Update travel preferences."""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UpdatePreferencesSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Preferences updated.',
                'user': UserSerializer(request.user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Change Password ──────────────────────────────────────────────────────────

class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — Change user password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully.'})


# ─── User Stats ───────────────────────────────────────────────────────────────

class UserStatsView(APIView):
    """GET /api/auth/stats/ — Get trip statistics for current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from trips.models import Trip

        user_trips = Trip.objects.filter(user=request.user)
        total_trips = user_trips.count()

        destinations = list(user_trips.values_list('destination', flat=True))
        unique_dest = len(set(d.split(',')[0].strip() for d in destinations))

        total_budget = user_trips.aggregate(total=Sum('budget'))['total'] or 0
        total_estimated = user_trips.aggregate(total=Sum('total_estimated_cost'))['total'] or 0
        total_days = sum(t.days_count for t in user_trips)

        # Top destinations
        from collections import Counter
        dest_counts = Counter(d.split(',')[0].strip() for d in destinations)
        top_dests = [d for d, _ in dest_counts.most_common(5)]

        # Trips this month
        now = timezone.now()
        trips_this_month = user_trips.filter(
            created_at__year=now.year,
            created_at__month=now.month
        ).count()

        return Response({
            'total_trips': total_trips,
            'unique_destinations': unique_dest,
            'total_days_planned': total_days,
            'total_budget_planned': float(total_budget),
            'total_estimated_spend': float(total_estimated),
            'top_destinations': top_dests,
            'trips_this_month': trips_this_month,
            'trip_limit': request.user.trip_limit,
            'subscription_type': request.user.subscription_type,
        })


# ─── Upgrade Subscription ─────────────────────────────────────────────────────

class UpgradeSubscriptionView(APIView):
    """POST /api/auth/upgrade/ — Upgrade user subscription plan (after Razorpay payment)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get('plan')
        if plan not in ('Pro', 'Premium'):
            return Response(
                {'error': 'Invalid plan. Choose Pro or Premium.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # In production this would verify Razorpay payment_id first
        payment_id = request.data.get('payment_id', 'simulated')

        user = request.user
        user.subscription_type = plan
        user.subscription_expires_at = timezone.now() + timezone.timedelta(days=30)
        user.save()

        logger.info(f"User {user.email} upgraded to {plan} (payment: {payment_id})")

        return Response({
            'message': f'Successfully upgraded to {plan}!',
            'user': UserSerializer(user).data,
        })
