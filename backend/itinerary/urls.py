"""Itinerary URL patterns."""
from django.urls import path
from .views import DayPlanListView, ActivityUpdateView

app_name = 'itinerary'

urlpatterns = [
    path('trip/<uuid:trip_id>/', DayPlanListView.as_view(), name='day-plan-list'),
    path('activity/<uuid:pk>/', ActivityUpdateView.as_view(), name='activity-update'),
]
