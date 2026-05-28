"""Admin registration for users app."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'name', 'subscription_type', 'is_staff', 'created_at']
    list_filter = ['subscription_type', 'is_staff', 'is_active', 'travel_style']
    search_fields = ['email', 'name']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name',)}),
        ('Subscription', {'fields': ('subscription_type', 'subscription_expires_at')}),
        ('Travel Preferences', {'fields': ('preferred_currency', 'travel_style', 'preferred_pace')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ['created_at', 'updated_at']

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'subscription_type'),
        }),
    )

    filter_horizontal = ('groups', 'user_permissions',)
