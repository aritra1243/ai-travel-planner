"""Itinerary models — DayPlan and Activity."""

import uuid
from django.db import models
from trips.models import Trip


class DayPlan(models.Model):
    """A single day in the trip itinerary."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='day_plans')
    day_number = models.PositiveIntegerField()
    theme = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    estimated_daily_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'itinerary_day_plans'
        ordering = ['day_number']
        unique_together = ['trip', 'day_number']

    def __str__(self):
        return f'Day {self.day_number}: {self.theme} ({self.trip.destination})'


class Activity(models.Model):
    """A single activity within a day plan."""

    TIME_OF_DAY_CHOICES = [
        ('Morning', 'Morning'),
        ('Afternoon', 'Afternoon'),
        ('Evening', 'Evening'),
        ('Night', 'Night'),
        ('All Day', 'All Day'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    day_plan = models.ForeignKey(DayPlan, on_delete=models.CASCADE, related_name='activities')
    time_of_day = models.CharField(max_length=20, choices=TIME_OF_DAY_CHOICES, default='Morning')
    activity_name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    estimated_cost = models.CharField(max_length=100, blank=True)  # e.g., "USD 25-50"
    transport_info = models.CharField(max_length=300, blank=True)
    duration = models.CharField(max_length=100, blank=True)  # e.g., "2 hours"
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'itinerary_activities'
        ordering = ['order', 'time_of_day']

    def __str__(self):
        return f'{self.time_of_day}: {self.activity_name}'
