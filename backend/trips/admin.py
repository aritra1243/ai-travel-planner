"""Admin for trips."""
from django.contrib import admin
from .models import Trip, Place


class PlaceInline(admin.TabularInline):
    model = Place
    extra = 0
    fields = ['name', 'category', 'latitude', 'longitude']


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['destination', 'user', 'start_date', 'end_date', 'budget', 'currency', 'travel_style', 'created_at']
    list_filter = ['travel_style', 'currency', 'accommodation']
    search_fields = ['destination', 'user__email', 'user__name']
    ordering = ['-created_at']
    inlines = [PlaceInline]
    readonly_fields = ['id', 'created_at', 'updated_at', 'share_token']


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'trip', 'latitude', 'longitude']
    list_filter = ['category']
    search_fields = ['name', 'trip__destination']
