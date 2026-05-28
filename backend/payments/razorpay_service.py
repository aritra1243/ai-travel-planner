"""
Razorpay payment service for AI Travel Planner.

Handles order creation, payment verification, and webhook processing.
Uses Razorpay Python SDK with HMAC-SHA256 signature verification.
"""

import hmac
import hashlib
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def get_razorpay_client():
    """Initialize and return Razorpay client."""
    import razorpay
    client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )
    return client


def create_order(amount_paise: int, currency: str = 'INR', receipt: str = '') -> dict:
    """
    Create a Razorpay payment order.

    Args:
        amount_paise: Amount in paise (1 INR = 100 paise)
        currency: Currency code (default: INR)
        receipt: Unique receipt ID for this order

    Returns:
        dict with order_id, amount, currency, key_id
    """
    client = get_razorpay_client()

    order_data = {
        'amount': amount_paise,
        'currency': currency,
        'receipt': receipt or f'receipt_{amount_paise}',
        'payment_capture': 1,  # Auto-capture
    }

    order = client.order.create(data=order_data)
    logger.info(f"Razorpay order created: {order['id']} for {amount_paise} paise")

    return {
        'order_id': order['id'],
        'amount': order['amount'],
        'currency': order['currency'],
        'key_id': settings.RAZORPAY_KEY_ID,
        'name': 'Vagabond AI Travel Planner',
        'description': f'Subscription Plan',
    }


def verify_payment(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    """
    Verify Razorpay payment signature using HMAC-SHA256.

    This is MANDATORY for security — always verify before upgrading subscription.

    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        is_valid = hmac.compare_digest(generated_signature, razorpay_signature)

        if is_valid:
            logger.info(f"Payment verified: {razorpay_payment_id}")
        else:
            logger.warning(f"Payment signature mismatch: {razorpay_payment_id}")

        return is_valid
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        return False


def get_subscription_plans():
    """Return subscription plans with Razorpay amounts."""
    return {
        'Free': {
            'name': 'Free Explorer',
            'price_inr': 0,
            'amount_paise': 0,
            'trip_limit': 3,
            'features': [
                '3 AI trips per month',
                'Interactive maps',
                'Budget estimator',
                'Weather insights',
            ]
        },
        'Pro': {
            'name': 'Pro Traveler',
            'price_inr': 299,
            'amount_paise': 29900,
            'trip_limit': None,
            'features': [
                'Unlimited AI trips',
                'AI Chat assistant',
                'Trip sharing',
                'Priority generation',
                'Advanced budget tools',
                'All Free features',
            ]
        },
        'Premium': {
            'name': 'Premium Nomad',
            'price_inr': 599,
            'amount_paise': 59900,
            'trip_limit': None,
            'features': [
                'Everything in Pro',
                'Multi-destination support',
                'Live currency rates',
                'PDF export',
                'VIP support',
                'Early access to new features',
            ]
        },
    }
