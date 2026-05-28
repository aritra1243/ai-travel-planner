"""Serializers for trips app."""

from rest_framework import serializers
from .models import Trip, Place


class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ['id', 'name', 'category', 'latitude', 'longitude',
                  'description', 'price_range', 'rating', 'order']


class TripListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the dashboard trip list."""
    days_count = serializers.ReadOnlyField()
    is_over_budget = serializers.ReadOnlyField()
    place_count = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id', 'destination', 'start_date', 'end_date',
            'budget', 'currency', 'total_estimated_cost',
            'interests', 'travel_style', 'pace',
            'days_count', 'is_over_budget', 'place_count',
            'created_at', 'is_public', 'share_token',
        ]

    def get_place_count(self, obj):
        return obj.places.count()


class TripDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested places and itinerary."""
    days_count = serializers.ReadOnlyField()
    is_over_budget = serializers.ReadOnlyField()
    places = PlaceSerializer(many=True, read_only=True)
    daily_itinerary = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id', 'destination', 'destination_lat', 'destination_lng',
            'start_date', 'end_date', 'budget', 'currency', 'total_estimated_cost',
            'interests', 'travel_style', 'pace', 'accommodation',
            'weather_avg_temp', 'weather_condition', 'weather_recommendations', 'weather_best_months',
            'budget_breakdown', 'saving_tips',
            'notes', 'share_token', 'is_public',
            'days_count', 'is_over_budget',
            'places', 'daily_itinerary',
            'created_at', 'updated_at',
        ]

    def get_daily_itinerary(self, obj):
        from itinerary.serializers import DayPlanSerializer
        return DayPlanSerializer(obj.day_plans.all(), many=True).data


class CreateTripSerializer(serializers.ModelSerializer):
    """Serializer for creating a new trip (pre-AI generation)."""

    class Meta:
        model = Trip
        fields = [
            'destination', 'start_date', 'end_date',
            'budget', 'currency', 'interests',
            'travel_style', 'pace', 'accommodation',
        ]

    def validate(self, attrs):
        if attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError('Start date must be before end date.')
        return attrs


class UpdateTripSerializer(serializers.ModelSerializer):
    """Serializer for editing trip notes."""
    class Meta:
        model = Trip
        fields = ['notes', 'destination']
