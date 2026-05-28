"""Models for trips app."""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Trip(models.Model):
    """A user's travel plan."""

    CURRENCY_CHOICES = [
        ('USD', 'USD'), ('EUR', 'EUR'), ('GBP', 'GBP'), ('JPY', 'JPY'),
        ('INR', 'INR'), ('AUD', 'AUD'), ('CAD', 'CAD'), ('SGD', 'SGD'), ('AED', 'AED'),
    ]
    TRAVEL_STYLE_CHOICES = [
        ('Adventure', 'Adventure'), ('Relaxing', 'Relaxing'), ('Cultural', 'Cultural'),
        ('Foodie', 'Foodie'), ('Budget', 'Budget'), ('Luxury', 'Luxury'), ('Balanced', 'Balanced'),
    ]
    PACE_CHOICES = [
        ('Very Slow', 'Very Slow'), ('Relaxed', 'Relaxed'), ('Moderate', 'Moderate'),
        ('Energetic', 'Energetic'), ('Packed', 'Packed'),
    ]
    ACCOMMODATION_CHOICES = [
        ('Hostel', 'Hostel'), ('Budget Hotel', 'Budget Hotel'), ('Hotel', 'Hotel'),
        ('Boutique Hotel', 'Boutique Hotel'), ('Luxury Resort', 'Luxury Resort'),
        ('Airbnb/Homestay', 'Airbnb/Homestay'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')

    # ─── Destination ──────────────────────────────────────────────────────────
    destination = models.CharField(max_length=200)
    destination_lat = models.FloatField(null=True, blank=True)
    destination_lng = models.FloatField(null=True, blank=True)

    # ─── Dates ────────────────────────────────────────────────────────────────
    start_date = models.DateField()
    end_date = models.DateField()

    # ─── Budget ───────────────────────────────────────────────────────────────
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=5, choices=CURRENCY_CHOICES, default='USD')
    total_estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # ─── Preferences ──────────────────────────────────────────────────────────
    interests = models.JSONField(default=list)
    travel_style = models.CharField(max_length=20, choices=TRAVEL_STYLE_CHOICES, default='Balanced')
    pace = models.CharField(max_length=20, choices=PACE_CHOICES, default='Moderate')
    accommodation = models.CharField(max_length=30, choices=ACCOMMODATION_CHOICES, default='Hotel')

    # ─── AI Generated Data ────────────────────────────────────────────────────
    weather_avg_temp = models.CharField(max_length=50, blank=True)
    weather_condition = models.CharField(max_length=200, blank=True)
    weather_recommendations = models.TextField(blank=True)
    weather_best_months = models.CharField(max_length=100, blank=True)
    budget_breakdown = models.JSONField(default=dict)  # accommodation, dining, etc.
    saving_tips = models.TextField(blank=True)

    # ─── Sharing ──────────────────────────────────────────────────────────────
    share_token = models.CharField(max_length=64, blank=True, null=True, unique=True, db_index=True)
    is_public = models.BooleanField(default=False)

    # ─── Notes ────────────────────────────────────────────────────────────────
    notes = models.TextField(blank=True)

    # ─── Timestamps ───────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trips'
        ordering = ['-created_at']
        verbose_name = 'Trip'
        verbose_name_plural = 'Trips'

    def __str__(self):
        return f'{self.user.name} → {self.destination} ({self.start_date})'

    @property
    def days_count(self):
        delta = self.end_date - self.start_date
        return max(delta.days + 1, 1)

    @property
    def is_over_budget(self):
        return float(self.total_estimated_cost) > float(self.budget)

    def generate_share_token(self):
        import secrets
        self.share_token = secrets.token_hex(16)
        self.is_public = True
        self.save(update_fields=['share_token', 'is_public'])
        return self.share_token


class Place(models.Model):
    """A geographic place associated with a trip."""

    CATEGORY_CHOICES = [
        ('hotel', 'Hotel/Accommodation'),
        ('restaurant', 'Restaurant/Dining'),
        ('attraction', 'Attraction/Sightseeing'),
        ('transport', 'Transport Hub'),
        ('shopping', 'Shopping'),
        ('nature', 'Nature/Park'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='places')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    latitude = models.FloatField()
    longitude = models.FloatField()
    description = models.TextField(blank=True)
    price_range = models.CharField(max_length=50, blank=True)
    rating = models.FloatField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'places'
        ordering = ['order', 'name']

    def __str__(self):
        return f'{self.name} ({self.category})'
