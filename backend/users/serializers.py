"""Serializers for users app."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for full user profile data."""

    class Meta:
        model = User
        fields = [
            'id', 'name', 'email',
            'subscription_type', 'subscription_expires_at',
            'preferred_currency', 'travel_style', 'preferred_pace',
            'profile_image', 'is_verified', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'subscription_type', 'subscription_expires_at',
            'is_verified', 'created_at', 'updated_at',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = ['name', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('This email address is already registered.')
        return value.lower()

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login credentials."""
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user data in response."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['name'] = user.name
        token['email'] = user.email
        token['subscription_type'] = user.subscription_type
        return token

    def validate(self, attrs):
        # Use email as username
        attrs['username'] = attrs.get('email', '')
        return super().validate(attrs)


class UpdatePreferencesSerializer(serializers.ModelSerializer):
    """Serializer for updating user travel preferences."""

    class Meta:
        model = User
        fields = ['preferred_currency', 'travel_style', 'preferred_pace', 'name', 'profile_image']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'New passwords do not match.'})
        return attrs


class UserStatsSerializer(serializers.Serializer):
    """Serializer for user trip statistics."""
    total_trips = serializers.IntegerField()
    unique_destinations = serializers.IntegerField()
    total_days_planned = serializers.IntegerField()
    total_budget_planned = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_estimated_spend = serializers.DecimalField(max_digits=12, decimal_places=2)
    top_destinations = serializers.ListField(child=serializers.CharField())
    trips_this_month = serializers.IntegerField()
