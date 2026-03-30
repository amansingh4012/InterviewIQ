from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import certifi

client = AsyncIOMotorClient(settings.mongodb_url, tlsCAFile=certifi.where())
db = client[settings.mongodb_db_name]

# Collections
sessions_collection = db["sessions"]
evaluations_collection = db["evaluations"]
users_collection = db["users"]
resumes_collection = db["resumes"]

async def create_indexes():
    await sessions_collection.create_index("user_id")
    await sessions_collection.create_index("created_at")
    await evaluations_collection.create_index("session_id")
    await resumes_collection.create_index("user_id")
