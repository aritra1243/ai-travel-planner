"""URL patterns for trips app."""

from django.urls import path
from .views import TripListView, TripDetailView, ShareTripView, SharedTripView

app_name = 'trips'

urlpatterns = [
    path('', TripListView.as_view(), name='trip-list'),
    path('<uuid:pk>/', TripDetailView.as_view(), name='trip-detail'),
    path('<uuid:pk>/share/', ShareTripView.as_view(), name='trip-share'),
    path('shared/<str:token>/', SharedTripView.as_view(), name='trip-shared'),
]
