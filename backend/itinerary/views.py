"""Views for itinerary app."""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import DayPlan, Activity
from .serializers import DayPlanSerializer, ActivitySerializer


class DayPlanListView(APIView):
    """GET /api/itinerary/trip/<trip_id>/ — Get all day plans for a trip."""
    permission_classes = [IsAuthenticated]

    def get(self, request, trip_id):
        day_plans = DayPlan.objects.filter(
            trip__id=trip_id,
            trip__user=request.user
        ).prefetch_related('activities')
        return Response(DayPlanSerializer(day_plans, many=True).data)


class ActivityUpdateView(APIView):
    """PUT /api/itinerary/activity/<id>/ — Update a single activity's notes."""
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            activity = Activity.objects.get(
                id=pk, day_plan__trip__user=request.user
            )
        except Activity.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ActivitySerializer(activity, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
