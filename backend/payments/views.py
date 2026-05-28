"""Payment views — create order, verify payment, get plans."""

import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .razorpay_service import create_order, verify_payment, get_subscription_plans
from users.serializers import UserSerializer

logger = logging.getLogger(__name__)


class GetPlansView(APIView):
    """GET /api/payments/plans/ — Get all subscription plans (no auth needed)."""
    permission_classes = [AllowAny]

    def get(self, request):
        plans = get_subscription_plans()
        return Response(plans)


class CreateOrderView(APIView):
    """
    POST /api/payments/create-order/
    Create a Razorpay payment order for plan upgrade.
    Frontend uses order_id to open Razorpay checkout widget.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get('plan')
        plans = get_subscription_plans()

        if plan not in plans:
            return Response(
                {'error': f'Invalid plan: {plan}. Choose Pro or Premium.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        plan_data = plans[plan]
        amount_paise = plan_data['amount_paise']

        if amount_paise == 0:
            return Response(
                {'error': 'Free plan does not require payment.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            receipt = f"user_{request.user.id}_{plan}_{int(timezone.now().timestamp())}"
            order_response = create_order(
                amount_paise=amount_paise,
                currency='INR',
                receipt=receipt[:40],
            )
            return Response({
                **order_response,
                'plan': plan,
                'plan_name': plan_data['name'],
                'user_email': request.user.email,
                'user_name': request.user.name,
            })
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            return Response(
                {'error': f'Payment initialization failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyPaymentView(APIView):
    """
    POST /api/payments/verify/
    Verify Razorpay payment signature and upgrade subscription.
    MUST be called after successful Razorpay checkout.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id', '')
        razorpay_payment_id = request.data.get('razorpay_payment_id', '')
        razorpay_signature = request.data.get('razorpay_signature', '')
        plan = request.data.get('plan', '')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, plan]):
            return Response(
                {'error': 'Missing payment verification fields.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if plan not in ('Pro', 'Premium'):
            return Response({'error': 'Invalid plan.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify signature
        is_valid = verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature)

        if not is_valid:
            logger.warning(f"Invalid payment signature from user {request.user.email}")
            return Response(
                {'error': 'Payment verification failed. Signature mismatch.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Upgrade subscription
        user = request.user
        user.subscription_type = plan
        user.subscription_expires_at = timezone.now() + timezone.timedelta(days=30)
        user.save(update_fields=['subscription_type', 'subscription_expires_at'])

        logger.info(f"User {user.email} upgraded to {plan} via Razorpay payment {razorpay_payment_id}")

        return Response({
            'success': True,
            'message': f'🎉 Successfully upgraded to {plan}! Enjoy unlimited travel planning.',
            'payment_id': razorpay_payment_id,
            'plan': plan,
            'user': UserSerializer(user).data,
        })


class WebhookView(APIView):
    """
    POST /api/payments/webhook/
    Razorpay webhook for payment events (subscription renewals, failures).
    Configure in Razorpay Dashboard > Webhooks.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import json
        import hmac
        import hashlib
        from django.conf import settings

        payload = request.body
        received_signature = request.headers.get('X-Razorpay-Signature', '')

        # Verify webhook signature
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, received_signature):
            logger.warning("Invalid webhook signature received")
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event_data = json.loads(payload)
            event_type = event_data.get('event')
            logger.info(f"Razorpay webhook: {event_type}")

            # Handle payment success
            if event_type == 'payment.captured':
                payment = event_data.get('payload', {}).get('payment', {}).get('entity', {})
                logger.info(f"Payment captured: {payment.get('id')} - {payment.get('amount')} paise")

        except Exception as e:
            logger.error(f"Webhook processing error: {e}")

        return Response({'status': 'ok'})
