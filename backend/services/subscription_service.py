from database import users_collection, sessions_collection
from models.user import SubscriptionTier, SubscriptionStatus
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Configuration
FREE_TIER_LIMIT = 10
PREMIUM_MONTHLY_LIMIT = 100  # Premium users get 100/month
ENTERPRISE_LIMIT = None  # Unlimited

# Collection for payment confirmations
payments_collection = users_collection.database["payment_confirmations"]


class SubscriptionService:
    """Manages user subscriptions and interview limits."""

    async def get_or_create_user(self, user_id: str) -> dict:
        """Get existing user or create a new one with free tier."""
        user = await users_collection.find_one({"user_id": user_id})
        
        if not user:
            user = {
                "user_id": user_id,
                "created_at": datetime.now(timezone.utc),
                "subscription_tier": SubscriptionTier.FREE,
                "demo_interviews_used": 0,
                "demo_limit": FREE_TIER_LIMIT,
                "completed_interviews": 0,
                "monthly_interviews_used": 0,
                "monthly_reset_date": None,
            }
            await users_collection.insert_one(user)
            logger.info(f"Created new user profile: {user_id[:20]}...")
        
        return user

    async def check_can_start_interview(self, user_id: str) -> SubscriptionStatus:
        """Check if user can start a new interview based on their subscription."""
        user = await self.get_or_create_user(user_id)
        tier = user.get("subscription_tier", SubscriptionTier.FREE)
        
        # Count completed interviews for this user
        completed_count = await sessions_collection.count_documents({
            "user_id": user_id,
            "status": "completed"
        })
        
        # Update the user's completed count if different
        if completed_count != user.get("completed_interviews", 0):
            await users_collection.update_one(
                {"user_id": user_id},
                {"$set": {"completed_interviews": completed_count}}
            )

        if tier == SubscriptionTier.FREE:
            demo_used = completed_count
            demo_limit = user.get("demo_limit", FREE_TIER_LIMIT)
            
            if demo_used >= demo_limit:
                return SubscriptionStatus(
                    user_id=user_id,
                    tier=tier,
                    can_start_interview=False,
                    interviews_remaining=0,
                    reason="demo_limit_reached",
                    upgrade_prompt=f"You've used all {demo_limit} free demo interviews. Upgrade to Premium for unlimited practice!"
                )
            
            return SubscriptionStatus(
                user_id=user_id,
                tier=tier,
                can_start_interview=True,
                interviews_remaining=demo_limit - demo_used,
                reason=None,
                upgrade_prompt=f"{demo_limit - demo_used} free interviews remaining. Upgrade for unlimited access!"
            )

        elif tier == SubscriptionTier.PREMIUM:
            # Check subscription validity
            expires_at = user.get("subscription_expires_at")
            if expires_at and expires_at < datetime.now(timezone.utc):
                # Subscription expired, downgrade to free
                await self.downgrade_to_free(user_id)
                return await self.check_can_start_interview(user_id)
            
            # Check monthly limit
            monthly_used = await self._get_monthly_usage(user_id, user)
            if monthly_used >= PREMIUM_MONTHLY_LIMIT:
                return SubscriptionStatus(
                    user_id=user_id,
                    tier=tier,
                    can_start_interview=False,
                    interviews_remaining=0,
                    reason="monthly_limit_reached",
                    upgrade_prompt="Monthly limit reached. Upgrade to Enterprise for unlimited interviews!"
                )
            
            return SubscriptionStatus(
                user_id=user_id,
                tier=tier,
                can_start_interview=True,
                interviews_remaining=PREMIUM_MONTHLY_LIMIT - monthly_used,
                reason=None,
                upgrade_prompt=None
            )

        elif tier == SubscriptionTier.ENTERPRISE:
            return SubscriptionStatus(
                user_id=user_id,
                tier=tier,
                can_start_interview=True,
                interviews_remaining=None,  # Unlimited
                reason=None,
                upgrade_prompt=None
            )

        # Default fallback
        return SubscriptionStatus(
            user_id=user_id,
            tier=SubscriptionTier.FREE,
            can_start_interview=False,
            reason="unknown_tier",
            upgrade_prompt="Please contact support."
        )

    async def _get_monthly_usage(self, user_id: str, user: dict) -> int:
        """Get the number of interviews completed this month."""
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        count = await sessions_collection.count_documents({
            "user_id": user_id,
            "status": "completed",
            "completed_at": {"$gte": month_start}
        })
        
        return count

    async def increment_interview_count(self, user_id: str) -> None:
        """Increment the user's interview count after completion."""
        await users_collection.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "completed_interviews": 1,
                    "demo_interviews_used": 1,
                    "monthly_interviews_used": 1
                }
            }
        )

    async def upgrade_subscription(
        self, 
        user_id: str, 
        tier: SubscriptionTier,
        payment_provider: str,
        customer_id: str,
        expires_at: Optional[datetime] = None
    ) -> dict:
        """Upgrade a user's subscription tier."""
        update_data = {
            "subscription_tier": tier,
            "subscription_started_at": datetime.now(timezone.utc),
            "subscription_expires_at": expires_at,
        }
        
        if payment_provider == "stripe":
            update_data["stripe_customer_id"] = customer_id
        elif payment_provider == "razorpay":
            update_data["razorpay_customer_id"] = customer_id
        
        await users_collection.update_one(
            {"user_id": user_id},
            {"$set": update_data},
            upsert=True
        )
        
        logger.info(f"Upgraded user {user_id[:20]}... to {tier} via {payment_provider}")
        
        return {"success": True, "tier": tier}

    async def downgrade_to_free(self, user_id: str) -> None:
        """Downgrade user to free tier (e.g., on subscription expiry)."""
        await users_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "subscription_tier": SubscriptionTier.FREE,
                    "subscription_expires_at": None
                }
            }
        )
        logger.info(f"Downgraded user {user_id[:20]}... to free tier")

    async def get_subscription_status(self, user_id: str) -> dict:
        """Get detailed subscription status for frontend display."""
        status = await self.check_can_start_interview(user_id)
        user = await self.get_or_create_user(user_id)
        
        return {
            "user_id": user_id,
            "tier": status.tier,
            "can_start_interview": status.can_start_interview,
            "interviews_remaining": status.interviews_remaining,
            "reason": status.reason,
            "upgrade_prompt": status.upgrade_prompt,
            "completed_interviews": user.get("completed_interviews", 0),
            "subscription_expires_at": user.get("subscription_expires_at"),
        }

    async def record_payment_confirmation(
        self,
        user_id: str,
        payment_provider: str,
        payment_id: str,
        customer_id: str
    ) -> None:
        """Record a confirmed payment from webhook for later verification."""
        await payments_collection.insert_one({
            "user_id": user_id,
            "payment_provider": payment_provider,
            "payment_id": payment_id,
            "customer_id": customer_id,
            "confirmed_at": datetime.now(timezone.utc),
            "used": False  # Mark as used when upgrade endpoint is called
        })
        logger.info(f"Recorded payment confirmation for user {user_id[:20]}...")

    async def verify_payment_record(
        self,
        user_id: str,
        payment_provider: str,
        payment_intent_id: str
    ) -> bool:
        """Verify that a payment was confirmed via webhook before allowing upgrade."""
        payment = await payments_collection.find_one({
            "user_id": user_id,
            "payment_provider": payment_provider,
            "payment_id": payment_intent_id,
            "used": False
        })
        
        if payment:
            # Mark the payment as used to prevent replay attacks
            await payments_collection.update_one(
                {"_id": payment["_id"]},
                {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
            )
            return True
        
        return False

    async def handle_subscription_cancelled(
        self,
        payment_provider: str,
        customer_id: str
    ) -> None:
        """Handle subscription cancellation from payment provider webhook."""
        # Find user by customer_id
        query = {}
        if payment_provider == "stripe":
            query["stripe_customer_id"] = customer_id
        elif payment_provider == "razorpay":
            query["razorpay_customer_id"] = customer_id
        else:
            logger.warning(f"Unknown payment provider: {payment_provider}")
            return
        
        user = await users_collection.find_one(query)
        if user:
            await self.downgrade_to_free(user["user_id"])
            logger.info(f"Subscription cancelled for customer {customer_id} via {payment_provider}")
        else:
            logger.warning(f"Could not find user for cancelled subscription: {customer_id}")


subscription_service = SubscriptionService()
