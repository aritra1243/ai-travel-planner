"""Views for ai_engine — trip generation and AI chat endpoints."""

import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings

from .gemini_service import generate_itinerary, chat_with_ai
from trips.models import Trip, Place
from itinerary.models import DayPlan, Activity
from trips.serializers import TripDetailSerializer

logger = logging.getLogger('ai_engine')


class GenerateTripView(APIView):
    """
    POST /api/ai/generate/
    Generate a full AI-powered travel itinerary using Gemini.
    Creates and saves the Trip, DayPlans, Activities, and Places to the database.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        # ── Validate required fields ──────────────────────────────────────────
        required = ['destination', 'start_date', 'end_date', 'budget']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Parse and validate dates ──────────────────────────────────────────
        from datetime import date
        try:
            start = date.fromisoformat(data['start_date'])
            end = date.fromisoformat(data['end_date'])
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        if start > end:
            return Response({'error': 'Start date must be before end date.'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Quota check ───────────────────────────────────────────────────────
        trip_limit = user.trip_limit
        if trip_limit is not None:
            current_count = Trip.objects.filter(user=user).count()
            if current_count >= trip_limit:
                return Response({
                    'error': f'Free plan limit reached ({trip_limit} trips). '
                             f'Upgrade to Pro in Settings for unlimited itineraries!'
                }, status=status.HTTP_403_FORBIDDEN)

        # ── Calculate days ────────────────────────────────────────────────────
        days_count = min((end - start).days + 1, 10)
        if days_count < 1:
            days_count = 1

        # ── Extract params ────────────────────────────────────────────────────
        destination = data.get('destination', '').strip()
        starting_location = data.get('starting_location', '').strip()
        budget = float(data.get('budget', 1500))
        currency = data.get('currency', user.preferred_currency or 'USD')
        interests = data.get('interests', ['Sightseeing'])
        travel_style = data.get('travel_style', user.travel_style or 'Balanced')
        pace = data.get('pace', user.preferred_pace or 'Moderate')
        accommodation = data.get('accommodation', 'Hotel')

        if isinstance(interests, str):
            interests = [interests]
        if not interests:
            interests = ['Sightseeing', 'Local Culture']

        # ── Check AI API key ─────────────────────────────────────────────────
        if not settings.GEMINI_API_KEY:
            return Response({
                'error': 'AI API key not configured. Add GEMINI_API_KEY to your backend .env file.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        logger.info(f"Generating trip: {destination} for {user.email} ({days_count} days)")

        try:
            # ── Call AI to generate itinerary ─────────────────────────────────
            ai_data = generate_itinerary(
                destination=destination,
                starting_location=starting_location,
                start_date=str(start),
                end_date=str(end),
                budget=budget,
                currency=currency,
                interests=interests,
                travel_style=travel_style,
                pace=pace,
                accommodation=accommodation,
                days_count=days_count,
            )

            # ── Create Trip in database ───────────────────────────────────────
            budget_data = ai_data.get('budget_breakdown', {})
            weather_data = ai_data.get('weather_forecast', {})

            trip = Trip.objects.create(
                user=user,
                destination=destination,
                start_date=start,
                end_date=end,
                budget=budget,
                currency=currency,
                interests=interests,
                travel_style=travel_style,
                pace=pace,
                accommodation=accommodation,
                total_estimated_cost=float(budget_data.get('total_estimate', 0)),
                budget_breakdown=budget_data,
                saving_tips=budget_data.get('saving_tips', ''),
                weather_avg_temp=weather_data.get('average_temp', ''),
                weather_condition=weather_data.get('condition', ''),
                weather_recommendations=weather_data.get('recommendations', ''),
                weather_best_months=weather_data.get('best_months', ''),
            )

            # ── Create DayPlans + Activities ──────────────────────────────────
            for day_data in ai_data.get('daily_itinerary', []):
                day_plan = DayPlan.objects.create(
                    trip=trip,
                    day_number=day_data.get('day_number', 1),
                    theme=day_data.get('theme', ''),
                    estimated_daily_cost=float(day_data.get('estimated_daily_cost', 0)),
                )

                for order_idx, act_data in enumerate(day_data.get('activities', []), start=1):
                    Activity.objects.create(
                        day_plan=day_plan,
                        time_of_day=act_data.get('time_of_day', 'Morning'),
                        activity_name=act_data.get('activity_name', ''),
                        description=act_data.get('description', ''),
                        estimated_cost=str(act_data.get('estimated_cost', '')),
                        transport_info=act_data.get('transport_info', ''),
                        duration=act_data.get('duration', ''),
                        order=act_data.get('order', order_idx),
                    )

            # ── Create Places ─────────────────────────────────────────────────
            for place_idx, place_data in enumerate(ai_data.get('places', []), start=1):
                lat = place_data.get('latitude')
                lng = place_data.get('longitude')
                if lat is None or lng is None:
                    continue

                Place.objects.create(
                    trip=trip,
                    name=place_data.get('name', ''),
                    category=place_data.get('category', 'other').lower(),
                    latitude=float(lat),
                    longitude=float(lng),
                    description=place_data.get('description', ''),
                    price_range=place_data.get('price_range', ''),
                    rating=float(place_data['rating']) if place_data.get('rating') else None,
                    order=place_data.get('order', place_idx),
                )

            logger.info(f"Trip generated successfully: {trip.id}")

            # ── Return full trip data ─────────────────────────────────────────
            serializer = TripDetailSerializer(
                Trip.objects.prefetch_related('places', 'day_plans__activities').get(id=trip.id)
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            logger.error(f"AI generation ValueError: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except Exception as e:
            logger.error(f"AI generation failed: {type(e).__name__}: {e}")
            return Response(
                {'error': 'AI itinerary generation failed. Please try again.', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TripChatView(APIView):
    """
    POST /api/ai/chat/<trip_id>/
    AI chat assistant for a specific trip — answers questions about the itinerary.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, trip_id):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(message) > 500:
            return Response({'error': 'Message too long (max 500 chars).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            trip = Trip.objects.prefetch_related('places').get(
                id=trip_id, user=request.user
            )
        except Trip.DoesNotExist:
            return Response({'error': 'Trip not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not settings.GEMINI_API_KEY:
            return Response({'error': 'AI chat not available — API key not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Build context for AI
        top_places = [p.name for p in trip.places.all()[:5]]
        trip_context = {
            'destination': trip.destination,
            'days_count': trip.days_count,
            'start_date': str(trip.start_date),
            'end_date': str(trip.end_date),
            'budget': float(trip.budget),
            'currency': trip.currency,
            'travel_style': trip.travel_style,
            'interests': trip.interests,
            'top_places': top_places,
            'total_estimated': float(trip.total_estimated_cost),
            'weather_temp': trip.weather_avg_temp,
            'weather_condition': trip.weather_condition,
        }

        try:
            reply = chat_with_ai(trip_context, message)
            return Response({'reply': reply})
        except Exception as e:
            logger.error(f"Chat AI error: {e}")
            return Response(
                {'reply': 'I\'m having trouble connecting right now. Please try again!'},
                status=status.HTTP_200_OK
            )
