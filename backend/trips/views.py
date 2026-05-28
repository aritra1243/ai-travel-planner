"""Views for trips app — CRUD operations."""

import logging
import secrets
from rest_framework import status, generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Trip, Place
from .serializers import TripListSerializer, TripDetailSerializer, UpdateTripSerializer

logger = logging.getLogger(__name__)


class TripListView(generics.ListAPIView):
    """GET /api/trips/ — List all trips for the current user."""
    serializer_class = TripListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['destination']
    ordering_fields = ['created_at', 'start_date', 'budget', 'destination']
    ordering = ['-created_at']

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user).prefetch_related('places')


class TripDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/trips/<id>/ — Trip detail, update notes, or delete."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UpdateTripSerializer
        return TripDetailSerializer

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user).prefetch_related(
            'places', 'day_plans__activities'
        )

    def destroy(self, request, *args, **kwargs):
        trip = self.get_object()
        destination = trip.destination
        trip.delete()
        logger.info(f"Trip deleted: {destination} by {request.user.email}")
        return Response({'message': f'Trip to {destination} deleted successfully.'})


class ShareTripView(APIView):
    """POST /api/trips/<id>/share/ — Generate or get a share link."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            trip = Trip.objects.get(id=pk, user=request.user)
        except Trip.DoesNotExist:
            return Response({'error': 'Trip not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not trip.share_token:
            trip.generate_share_token()

        share_url = f"{request.scheme}://{request.get_host()}/api/trips/shared/{trip.share_token}/"
        return Response({
            'share_token': trip.share_token,
            'share_url': share_url,
            'is_public': trip.is_public,
        })

    def delete(self, request, pk):
        """Remove share link."""
        try:
            trip = Trip.objects.get(id=pk, user=request.user)
        except Trip.DoesNotExist:
            return Response({'error': 'Trip not found.'}, status=status.HTTP_404_NOT_FOUND)

        trip.share_token = None
        trip.is_public = False
        trip.save(update_fields=['share_token', 'is_public'])
        return Response({'message': 'Share link removed.'})


class SharedTripView(APIView):
    """GET /api/trips/shared/<token>/ — View a shared trip (no auth)."""
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            trip = Trip.objects.get(share_token=token, is_public=True)
        except Trip.DoesNotExist:
            return Response(
                {'error': 'Shared trip not found or link expired.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = TripDetailSerializer(trip)
        return Response(serializer.data)
