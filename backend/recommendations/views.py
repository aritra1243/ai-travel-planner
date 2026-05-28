"""Recommendations views — popular destinations, travel tips."""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


POPULAR_DESTINATIONS = [
    {"name": "Tokyo", "country": "Japan", "emoji": "🗼", "tag": "Anime & Culture", "best_season": "Spring", "avg_budget_usd": 1800, "image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80", "lat": 35.6762, "lng": 139.6503},
    {"name": "Paris", "country": "France", "emoji": "🗺️", "tag": "Romance & Art", "best_season": "Summer", "avg_budget_usd": 2200, "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80", "lat": 48.8566, "lng": 2.3522},
    {"name": "Bali", "country": "Indonesia", "emoji": "🌴", "tag": "Beach & Wellness", "best_season": "Dry Season", "avg_budget_usd": 900, "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80", "lat": -8.3405, "lng": 115.0920},
    {"name": "New York", "country": "USA", "emoji": "🗽", "tag": "Urban & Food", "best_season": "Fall", "avg_budget_usd": 2500, "image": "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=800&q=80", "lat": 40.7128, "lng": -74.0060},
    {"name": "Santorini", "country": "Greece", "emoji": "🏛️", "tag": "Islands & Views", "best_season": "Summer", "avg_budget_usd": 2000, "image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80", "lat": 36.3932, "lng": 25.4615},
    {"name": "Kyoto", "country": "Japan", "emoji": "⛩️", "tag": "History & Temples", "best_season": "Spring/Autumn", "avg_budget_usd": 1600, "image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80", "lat": 35.0116, "lng": 135.7681},
    {"name": "Barcelona", "country": "Spain", "emoji": "🎨", "tag": "Architecture & Nightlife", "best_season": "Spring", "avg_budget_usd": 1700, "image": "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80", "lat": 41.3851, "lng": 2.1734},
    {"name": "Dubai", "country": "UAE", "emoji": "🌆", "tag": "Luxury & Desert", "best_season": "Winter", "avg_budget_usd": 2800, "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80", "lat": 25.2048, "lng": 55.2708},
    {"name": "Goa", "country": "India", "emoji": "🌊", "tag": "Beach & Relaxation", "best_season": "Winter", "avg_budget_usd": 500, "image": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80", "lat": 15.2993, "lng": 74.1240},
    {"name": "Istanbul", "country": "Turkey", "emoji": "🕌", "tag": "History & Food", "best_season": "Spring", "avg_budget_usd": 1100, "image": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80", "lat": 41.0082, "lng": 28.9784},
    {"name": "Maldives", "country": "Indian Ocean", "emoji": "🐠", "tag": "Luxury Beach", "best_season": "Dry Season", "avg_budget_usd": 3500, "image": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80", "lat": 3.2028, "lng": 73.2207},
    {"name": "Rome", "country": "Italy", "emoji": "🏟️", "tag": "History & Cuisine", "best_season": "Spring", "avg_budget_usd": 1900, "image": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80", "lat": 41.9028, "lng": 12.4964},
]


class PopularDestinationsView(APIView):
    """GET /api/recommendations/destinations/ — Popular travel destinations."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(POPULAR_DESTINATIONS)


class TravelTipsView(APIView):
    """GET /api/recommendations/tips/ — General travel tips."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'tips': [
                {'category': 'Packing', 'tip': 'Roll clothes instead of folding to save space and reduce wrinkles.'},
                {'category': 'Money', 'tip': 'Always carry local currency for small vendors and markets.'},
                {'category': 'Safety', 'tip': 'Keep digital copies of all important documents in cloud storage.'},
                {'category': 'Transport', 'tip': 'Book transportation in advance for peak season destinations.'},
                {'category': 'Food', 'tip': 'Try street food during lunch hours for authentic flavors at lower prices.'},
                {'category': 'Accommodation', 'tip': 'Check in online when available to skip queues and save time.'},
            ]
        })
