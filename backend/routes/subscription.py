from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, timedelta, timezone
from auth import verify_clerk_token
from services.subscription_service import subscription_service
from models.user import SubscriptionTier
from config import settings
import logging
import hmac
import hashlib
import json

logger = logging.getLogger(__name__)
security_logger = logging.getLogger("security")

router = APIRouter()

# Initialize Stripe if configured
stripe = None
try:
    import stripe as stripe_module
    if settings.stripe_secret_key:
        stripe_module.api_key = settings.stripe_secret_key
        stripe = stripe_module
        logger.info("Stripe SDK initialized successfully")
    else:
        logger.warning("Stripe secret key not configured - checkout disabled")
except ImportError:
    logger.warning("Stripe SDK not installed - run: pip install stripe")


# Pricing configuration
PRICING_CONFIG = {
    "premium": {
        "name": "Premium",
        "price_cents": 1900,  # $19.00
        "currency": "usd",
        "interval": "month",
        "features": [
            "100 mock interviews per month",
            "Full detailed performance reports",
            "Question-by-question feedback",
            "Study recommendations with resources",
            "Progress tracking & analytics",
            "Priority email support"
        ],
        "interview_limit": 100,
    },
    "enterprise": {
        "name": "Enterprise",
        "price_cents": 4900,  # $49.00
        "currency": "usd",
        "interval": "month",
        "features": [
            "Unlimited mock interviews",
            "Everything in Premium",
            "Custom interview scenarios",
            "Team analytics dashboard",
            "API access",
            "Dedicated support"
        ],
        "interview_limit": None,  # Unlimited
    }
}


class UpgradeRequest(BaseModel):
    """Request model for subscription upgrade."""
    tier: str = Field(..., min_length=1, max_length=20)
    payment_provider: str = Field(..., min_length=1, max_length=20)
    customer_id: str = Field(..., min_length=1, max_length=100)
    payment_intent_id: Optional[str] = Field(None, max_length=100)
    
    @field_validator("payment_provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in ["stripe", "razorpay"]:
            raise ValueError("Invalid payment provider")
        return v


class CreateCheckoutRequest(BaseModel):
    """Request to create a Stripe checkout session."""
    tier: str = Field(..., min_length=1, max_length=20)
    
    @field_validator("tier")
    @classmethod
    def validate_tier(cls, v: str) -> str:
        if v.lower() not in ["premium", "enterprise"]:
            raise ValueError("Invalid tier. Must be 'premium' or 'enterprise'")
        return v.lower()


def verify_stripe_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify Stripe webhook signature.
    https://stripe.com/docs/webhooks/signatures
    """
    if not secret:
        logger.warning("Stripe webhook secret not configured")
        return False
    
    try:
        # Stripe signature format: t=timestamp,v1=signature
        parts = dict(item.split("=", 1) for item in signature.split(","))
        timestamp = parts.get("t")
        expected_sig = parts.get("v1")
        
        if not timestamp or not expected_sig:
            return False
        
        # Create signed payload
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
        
        # Calculate expected signature
        computed_sig = hmac.new(
            secret.encode('utf-8'),
            signed_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_sig, expected_sig)
    except Exception as e:
        logger.error(f"Stripe signature verification failed: {type(e).__name__}")
        return False


def verify_razorpay_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify Razorpay webhook signature.
    https://razorpay.com/docs/webhooks/
    """
    if not secret:
        logger.warning("Razorpay webhook secret not configured")
        return False
    
    try:
        computed_sig = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_sig, signature)
    except Exception as e:
        logger.error(f"Razorpay signature verification failed: {type(e).__name__}")
        return False


@router.get("/status")
async def get_subscription_status(user_id: str = Depends(verify_clerk_token)):
    """Get current subscription status for the authenticated user."""
    try:
        status = await subscription_service.get_subscription_status(user_id)
        return status
    except Exception as e:
        logger.error(f"Error getting subscription status: {type(e).__name__}")
        raise HTTPException(status_code=503, detail="Unable to retrieve subscription status")


@router.get("/can-start")
async def can_start_interview(user_id: str = Depends(verify_clerk_token)):
    """Quick check if user can start a new interview."""
    try:
        status = await subscription_service.check_can_start_interview(user_id)
        return {
            "can_start": status.can_start_interview,
            "interviews_remaining": status.interviews_remaining,
            "reason": status.reason,
            "upgrade_prompt": status.upgrade_prompt,
            "tier": status.tier.value if hasattr(status.tier, 'value') else status.tier,
        }
    except Exception as e:
        logger.error(f"Error checking interview eligibility: {type(e).__name__}")
        raise HTTPException(status_code=503, detail="Unable to check eligibility")


@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CreateCheckoutRequest,
    user_id: str = Depends(verify_clerk_token)
):
    """
    Create a Stripe Checkout Session for subscription upgrade.
    Returns a checkout URL that the frontend should redirect to.
    """
    if not stripe:
        raise HTTPException(
            status_code=503,
            detail="Payment system not configured. Please contact support."
        )
    
    tier_config = PRICING_CONFIG.get(request.tier)
    if not tier_config:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    # Get or use configured Stripe Price ID
    price_id = None
    if request.tier == "premium" and settings.stripe_price_premium:
        price_id = settings.stripe_price_premium
    elif request.tier == "enterprise" and settings.stripe_price_enterprise:
        price_id = settings.stripe_price_enterprise
    
    try:
        # Build checkout session parameters
        checkout_params = {
            "mode": "subscription",
            "success_url": f"{settings.frontend_url}/dashboard?payment=success&tier={request.tier}",
            "cancel_url": f"{settings.frontend_url}/pricing?payment=cancelled",
            "metadata": {
                "user_id": user_id,
                "tier": request.tier,
            },
            "subscription_data": {
                "metadata": {
                    "user_id": user_id,
                    "tier": request.tier,
                }
            },
            "allow_promotion_codes": True,
        }
        
        if price_id:
            # Use pre-configured Stripe Price
            checkout_params["line_items"] = [{
                "price": price_id,
                "quantity": 1,
            }]
        else:
            # Create price on the fly (for development/testing)
            checkout_params["line_items"] = [{
                "price_data": {
                    "currency": tier_config["currency"],
                    "unit_amount": tier_config["price_cents"],
                    "recurring": {"interval": tier_config["interval"]},
                    "product_data": {
                        "name": f"InterviewIQ {tier_config['name']}",
                        "description": f"Monthly subscription to InterviewIQ {tier_config['name']} plan",
                    },
                },
                "quantity": 1,
            }]
        
        session = stripe.checkout.Session.create(**checkout_params)
        
        logger.info(f"Created checkout session for user {user_id[:20]}... tier={request.tier}")
        
        return {
            "checkout_url": session.url,
            "session_id": session.id,
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout: {e.user_message}")
        raise HTTPException(status_code=502, detail="Payment service error. Please try again.")
    except Exception as e:
        logger.error(f"Error creating checkout session: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Unable to create checkout session")


@router.post("/create-portal-session")
async def create_portal_session(user_id: str = Depends(verify_clerk_token)):
    """
    Create a Stripe Customer Portal session for managing subscriptions.
    Allows users to update payment methods, cancel, or change plans.
    """
    if not stripe:
        raise HTTPException(
            status_code=503,
            detail="Payment system not configured. Please contact support."
        )
    
    try:
        # Get user's Stripe customer ID from database
        user = await subscription_service.get_or_create_user(user_id)
        customer_id = user.get("stripe_customer_id")
        
        if not customer_id:
            raise HTTPException(
                status_code=400,
                detail="No active subscription found. Please subscribe first."
            )
        
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{settings.frontend_url}/dashboard",
        )
        
        return {"portal_url": session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating portal: {e.user_message}")
        raise HTTPException(status_code=502, detail="Payment service error. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating portal session: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Unable to access billing portal")


@router.post("/upgrade")
async def upgrade_subscription(
    request: UpgradeRequest,
    user_id: str = Depends(verify_clerk_token)
):
    """
    Upgrade user subscription after payment verification.
    NOTE: This endpoint should only be called after payment is confirmed via webhook.
    Direct calls without prior webhook verification will be rejected in production.
    """
    try:
        tier = SubscriptionTier(request.tier.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    # In production, verify the payment was already confirmed via webhook
    if settings.is_production:
        # Check if we have a confirmed payment record for this user/payment
        payment_confirmed = await subscription_service.verify_payment_record(
            user_id=user_id,
            payment_provider=request.payment_provider,
            payment_intent_id=request.payment_intent_id or request.customer_id
        )
        if not payment_confirmed:
            security_logger.warning(
                f"Upgrade attempt without confirmed payment: user={user_id[:20]}..., "
                f"provider={request.payment_provider}"
            )
            raise HTTPException(status_code=400, detail="Payment not verified. Please complete payment first.")
    
    # Calculate expiry (1 month from now for monthly subscriptions)
    expires_at = datetime.utcnow() + timedelta(days=30)
    
    result = await subscription_service.upgrade_subscription(
        user_id=user_id,
        tier=tier,
        payment_provider=request.payment_provider,
        customer_id=request.customer_id,
        expires_at=expires_at
    )
    
    logger.info(f"User upgraded to {tier.value}: {user_id[:20]}...")
    
    return {
        "success": True,
        "message": f"Successfully upgraded to {tier.value}",
        "tier": tier.value,
        "expires_at": expires_at.isoformat()
    }


@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature")
):
    """
    Handle Stripe webhook events with signature verification.
    """
    # Get raw body for signature verification
    body = await request.body()
    
    # Verify signature (required in production)
    if settings.stripe_webhook_secret:
        if not stripe_signature:
            security_logger.warning("Stripe webhook received without signature header")
            raise HTTPException(status_code=400, detail="Missing signature")
        
        if not verify_stripe_signature(body, stripe_signature, settings.stripe_webhook_secret):
            security_logger.warning("Stripe webhook signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid signature")
    elif settings.is_production:
        security_logger.error("Stripe webhook received but no secret configured - rejecting")
        raise HTTPException(status_code=500, detail="Webhook not configured")
    else:
        logger.warning("Stripe webhook signature verification skipped (development mode)")
    
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    event_type = payload.get("type", "")
    logger.info(f"Received Stripe webhook: {event_type}")
    
    if event_type == "checkout.session.completed":
        # Handle successful checkout - AUTO-UPGRADE user
        session_data = payload.get("data", {}).get("object", {})
        customer_id = session_data.get("customer")
        user_id = session_data.get("metadata", {}).get("user_id")
        tier_str = session_data.get("metadata", {}).get("tier", "premium")
        
        if user_id and customer_id:
            # Record the payment
            await subscription_service.record_payment_confirmation(
                user_id=user_id,
                payment_provider="stripe",
                payment_id=session_data.get("payment_intent") or session_data.get("id"),
                customer_id=customer_id
            )
            
            # Auto-upgrade the user
            try:
                tier = SubscriptionTier(tier_str.lower())
                expires_at = datetime.now(timezone.utc) + timedelta(days=30)
                
                await subscription_service.upgrade_subscription(
                    user_id=user_id,
                    tier=tier,
                    payment_provider="stripe",
                    customer_id=customer_id,
                    expires_at=expires_at
                )
                logger.info(f"Auto-upgraded user {user_id[:20]}... to {tier.value}")
            except Exception as e:
                logger.error(f"Failed to auto-upgrade user: {e}")
    
    elif event_type == "customer.subscription.updated":
        # Handle subscription changes (plan changes, renewals)
        sub_data = payload.get("data", {}).get("object", {})
        customer_id = sub_data.get("customer")
        status = sub_data.get("status")
        
        if status == "active" and customer_id:
            # Subscription renewed or updated
            logger.info(f"Subscription active for customer: {customer_id}")
    
    elif event_type == "customer.subscription.deleted":
        # Handle subscription cancellation
        sub_data = payload.get("data", {}).get("object", {})
        customer_id = sub_data.get("customer")
        if customer_id:
            await subscription_service.handle_subscription_cancelled(
                payment_provider="stripe",
                customer_id=customer_id
            )
            logger.info(f"Subscription cancelled for customer: {customer_id}")
    
    elif event_type == "invoice.payment_failed":
        # Handle failed payment
        invoice_data = payload.get("data", {}).get("object", {})
        customer_id = invoice_data.get("customer")
        if customer_id:
            logger.warning(f"Payment failed for Stripe customer: {customer_id}")
    
    return {"received": True}


@router.post("/webhook/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature")
):
    """
    Handle Razorpay webhook events with signature verification.
    """
    # Get raw body for signature verification
    body = await request.body()
    
    # Verify signature (required in production)
    if settings.razorpay_webhook_secret:
        if not x_razorpay_signature:
            security_logger.warning("Razorpay webhook received without signature header")
            raise HTTPException(status_code=400, detail="Missing signature")
        
        if not verify_razorpay_signature(body, x_razorpay_signature, settings.razorpay_webhook_secret):
            security_logger.warning("Razorpay webhook signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid signature")
    elif settings.is_production:
        security_logger.error("Razorpay webhook received but no secret configured - rejecting")
        raise HTTPException(status_code=500, detail="Webhook not configured")
    else:
        logger.warning("Razorpay webhook signature verification skipped (development mode)")
    
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    event_type = payload.get("event", "")
    logger.info(f"Received Razorpay webhook: {event_type}")
    
    if event_type == "payment.captured":
        # Handle successful payment
        payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment_data.get("id")
        user_id = payment_data.get("notes", {}).get("user_id")
        
        if user_id and payment_id:
            await subscription_service.record_payment_confirmation(
                user_id=user_id,
                payment_provider="razorpay",
                payment_id=payment_id,
                customer_id=payment_data.get("customer_id", "")
            )
            logger.info(f"Recorded Razorpay payment for user: {user_id[:20]}...")
    
    elif event_type == "subscription.cancelled":
        # Handle subscription cancellation
        sub_data = payload.get("payload", {}).get("subscription", {}).get("entity", {})
        customer_id = sub_data.get("customer_id")
        if customer_id:
            await subscription_service.handle_subscription_cancelled(
                payment_provider="razorpay",
                customer_id=customer_id
            )
    
    return {"received": True}


@router.get("/plans")
async def get_available_plans():
    """Get available subscription plans for display."""
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "currency": "USD",
                "features": [
                    "10 mock interviews total",
                    "AI-powered interviewer",
                    "Voice interaction",
                    "Basic score summary",
                ],
                "limitations": [
                    "No detailed question feedback",
                    "No study recommendations",
                    "No progress analytics",
                ],
                "cta": "Get Started Free",
            },
            {
                "id": "premium",
                "name": "Premium",
                "price": 19,
                "currency": "USD",
                "period": "month",
                "features": [
                    "100 mock interviews per month",
                    "Full detailed reports",
                    "Question-by-question feedback",
                    "Personalized study recommendations",
                    "Progress analytics over time",
                    "Custom interview focus areas",
                ],
                "popular": True,
                "cta": "Upgrade to Premium",
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price": 49,
                "currency": "USD",
                "period": "month",
                "features": [
                    "Unlimited mock interviews",
                    "All Premium features",
                    "Priority AI response times",
                    "Advanced analytics dashboard",
                    "Export interview transcripts",
                    "Priority email support",
                ],
                "cta": "Go Enterprise",
            }
        ]
    }
