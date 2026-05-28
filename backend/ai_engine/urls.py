"""AI Engine URL patterns."""
from django.urls import path
from .views import GenerateTripView, TripChatView

app_name = 'ai_engine'

urlpatterns = [
    path('generate/', GenerateTripView.as_view(), name='generate'),
    path('chat/<uuid:trip_id>/', TripChatView.as_view(), name='chat'),
]
