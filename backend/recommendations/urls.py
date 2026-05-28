"""Recommendations URL patterns."""
from django.urls import path
from .views import PopularDestinationsView, TravelTipsView

app_name = 'recommendations'

urlpatterns = [
    path('destinations/', PopularDestinationsView.as_view(), name='destinations'),
    path('tips/', TravelTipsView.as_view(), name='tips'),
]
