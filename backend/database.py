from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import certifi
import logging

logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(
    settings.mongodb_url,
    tlsCAFile=certifi.where(),
    maxPoolSize=10,                    # Limit connection pool (prevents leak on reload)
    minPoolSize=1,                     # Keep 1 warm connection
    serverSelectionTimeoutMS=5000,     # Fail fast (5s) instead of hanging for 30s
    connectTimeoutMS=5000,             # Connection timeout
    socketTimeoutMS=10000,             # Socket timeout
)
db = client[settings.mongodb_db_name]

# Collections
sessions_collection = db["sessions"]
evaluations_collection = db["evaluations"]
users_collection = db["users"]
resumes_collection = db["resumes"]


async def create_indexes():
    """Create database indexes for common query patterns. Handles connection failures gracefully."""
    try:
        await sessions_collection.create_index("user_id")
        await sessions_collection.create_index("created_at")
        await evaluations_collection.create_index("session_id")
        await resumes_collection.create_index("user_id")
        logger.info("MongoDB indexes created successfully")
    except Exception as e:
        logger.error(f"Failed to create MongoDB indexes (DB may be unreachable): {e}")
        logger.warning("App will continue but some queries may be slower. Indexes will be retried on next startup.")

