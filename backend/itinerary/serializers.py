"""Serializers for itinerary app."""

from rest_framework import serializers
from .models import DayPlan, Activity


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            'id', 'time_of_day', 'activity_name', 'description',
            'estimated_cost', 'transport_info', 'duration', 'order'
        ]


class DayPlanSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta:
        model = DayPlan
        fields = [
            'id', 'day_number', 'theme', 'notes',
            'estimated_daily_cost', 'activities'
        ]
