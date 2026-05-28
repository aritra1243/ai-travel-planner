"""Custom User model for AI Travel Planner."""

import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager for User model."""

    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required.')
        if not name:
            raise ValueError('Full name is required.')

        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('subscription_type', 'Premium')
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with travel preferences and subscription."""

    SUBSCRIPTION_CHOICES = [
        ('Free', 'Free'),
        ('Pro', 'Pro Explorer'),
        ('Premium', 'Premium Nomad'),
    ]

    TRAVEL_STYLE_CHOICES = [
        ('Adventure', 'Adventure'),
        ('Relaxing', 'Relaxing'),
        ('Cultural', 'Cultural'),
        ('Foodie', 'Foodie'),
        ('Budget', 'Budget'),
        ('Luxury', 'Luxury'),
        ('Balanced', 'Balanced'),
    ]

    PACE_CHOICES = [
        ('Very Slow', 'Very Slow'),
        ('Relaxed', 'Relaxed'),
        ('Moderate', 'Moderate'),
        ('Energetic', 'Energetic'),
        ('Packed', 'Packed'),
    ]

    CURRENCY_CHOICES = [
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
        ('JPY', 'Japanese Yen'),
        ('INR', 'Indian Rupee'),
        ('AUD', 'Australian Dollar'),
        ('CAD', 'Canadian Dollar'),
        ('SGD', 'Singapore Dollar'),
        ('AED', 'UAE Dirham'),
    ]

    # ─── Core Fields ──────────────────────────────────────────────────────────
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, db_index=True)

    # ─── Auth Fields ──────────────────────────────────────────────────────────
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # ─── Subscription ─────────────────────────────────────────────────────────
    subscription_type = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_CHOICES,
        default='Free'
    )
    subscription_expires_at = models.DateTimeField(null=True, blank=True)

    # ─── Travel Preferences ───────────────────────────────────────────────────
    preferred_currency = models.CharField(
        max_length=5,
        choices=CURRENCY_CHOICES,
        default='USD'
    )
    travel_style = models.CharField(
        max_length=20,
        choices=TRAVEL_STYLE_CHOICES,
        default='Balanced'
    )
    preferred_pace = models.CharField(
        max_length=20,
        choices=PACE_CHOICES,
        default='Moderate'
    )
    profile_image = models.TextField(null=True, blank=True)

    # ─── Timestamps ───────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} <{self.email}>'

    @property
    def trip_limit(self):
        """Returns trip limit based on subscription."""
        from django.conf import settings
        plan = settings.SUBSCRIPTION_PLANS.get(self.subscription_type, {})
        return plan.get('trip_limit', 3)

    @property
    def is_pro(self):
        return self.subscription_type in ('Pro', 'Premium')
