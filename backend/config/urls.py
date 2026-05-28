"""Root URL configuration for AI Travel Planner API."""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# ─── Swagger API Documentation ────────────────────────────────────────────────
schema_view = get_schema_view(
    openapi.Info(
        title="Vagabond AI Travel Planner API",
        default_version='v1',
        description=(
            "Full REST API for the AI Travel Planner SaaS.\n\n"
            "**Authentication**: Use JWT Bearer token.\n"
            "**AI**: Powered by Google Gemini 2.0.\n"
            "**Payments**: Razorpay (INR).\n"
        ),
        contact=openapi.Contact(email="support@vagabond.app"),
        license=openapi.License(name="MIT"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

# ─── URL Patterns ──────────────────────────────────────────────────────────────
urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API v1 Routes
    path('api/auth/', include('users.urls')),
    path('api/trips/', include('trips.urls')),
    path('api/itinerary/', include('itinerary.urls')),
    path('api/ai/', include('ai_engine.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/recommendations/', include('recommendations.urls')),

    # Swagger / OpenAPI Docs
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# ─── Media files in development ───────────────────────────────────────────────
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
