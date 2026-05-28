"""Payment URL patterns."""
from django.urls import path
from .views import GetPlansView, CreateOrderView, VerifyPaymentView, WebhookView

app_name = 'payments'

urlpatterns = [
    path('plans/', GetPlansView.as_view(), name='plans'),
    path('create-order/', CreateOrderView.as_view(), name='create-order'),
    path('verify/', VerifyPaymentView.as_view(), name='verify'),
    path('webhook/', WebhookView.as_view(), name='webhook'),
]
