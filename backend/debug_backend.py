"""
Senior Developer Backend Debugging Script
This script performs comprehensive checks on the backend setup
"""
import sys
import os
from pathlib import Path

print("=" * 60)
print("🔍 InterviewIQ Backend Debug Report")
print("=" * 60)
print()

# 1. Check Python Version
print("1️⃣  Python Environment:")
print(f"   Version: {sys.version}")
print(f"   Executable: {sys.executable}")
print()

# 2. Check working directory
print("2️⃣  Working Directory:")
backend_dir = Path(__file__).parent
os.chdir(backend_dir)
print(f"   Current: {os.getcwd()}")
print()

# 3. Check .env file
print("3️⃣  Environment Configuration:")
env_file = backend_dir / ".env"
if env_file.exists():
    print("   ✅ .env file exists")
    with open(env_file, 'r') as f:
        lines = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    print(f"   Variables count: {len(lines)}")
    
    # Check for required variables (without showing values)
    required_vars = [
        'GROQ_API_KEY',
        'MONGODB_URL',
        'MONGODB_DB_NAME',
        'CLERK_SECRET_KEY',
        'CLERK_JWT_PUBLIC_KEY',
        'ELEVENLABS_API_KEY',
        'ELEVENLABS_VOICE_ID'
    ]
    
    env_content = '\n'.join(lines)
    for var in required_vars:
        if var in env_content:
            print(f"   ✅ {var} configured")
        else:
            print(f"   ❌ {var} MISSING!")
else:
    print("   ❌ .env file NOT found!")
    print("   Please copy .env.example to .env and configure it.")
print()

# 4. Check dependencies
print("4️⃣  Required Dependencies:")
required_packages = {
    'fastapi': 'FastAPI framework',
    'uvicorn': 'ASGI server',
    'motor': 'Async MongoDB driver',
    'pymongo': 'MongoDB client',
    'pydantic': 'Data validation',
    'langchain': 'LLM framework',
    'langchain_groq': 'Groq integration',
    'elevenlabs': 'Text-to-Speech',
    'python_jose': 'JWT authentication'
}

missing_packages = []
for package, description in required_packages.items():
    try:
        __import__(package.replace('-', '_'))
        print(f"   ✅ {package:20s} - {description}")
    except ImportError:
        print(f"   ❌ {package:20s} - MISSING!")
        missing_packages.append(package)

if missing_packages:
    print()
    print("   ⚠️  To install missing packages:")
    print("   pip install -r requirements.txt")
print()

# 5. Test MongoDB connection
print("5️⃣  Database Connection:")
try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    from motor.motor_asyncio import AsyncIOMotorClient
    import asyncio
    import certifi
    
    mongodb_url = os.getenv('MONGODB_URL')
    if mongodb_url:
        async def test_connection():
            try:
                client = AsyncIOMotorClient(mongodb_url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
                await client.admin.command('ping')
                print("   ✅ MongoDB connection successful!")
                
                # Get database info
                db_name = os.getenv('MONGODB_DB_NAME', 'interviewiq')
                db = client[db_name]
                collections = await db.list_collection_names()
                print(f"   Database: {db_name}")
                print(f"   Collections: {len(collections)}")
                if collections:
                    print(f"   Found: {', '.join(collections)}")
                else:
                    print("   No collections yet (will be created on first use)")
                    
                client.close()
                return True
            except Exception as e:
                print(f"   ❌ MongoDB connection failed: {str(e)}")
                return False
        
        asyncio.run(test_connection())
    else:
        print("   ❌ MONGODB_URL not configured")
except Exception as e:
    print(f"   ❌ Error testing connection: {str(e)}")
print()

# 6. Check application files
print("6️⃣  Application Files:")
required_files = ['main.py', 'config.py', 'database.py', 'auth.py', 'requirements.txt']
for file in required_files:
    file_path = backend_dir / file
    if file_path.exists():
        print(f"   ✅ {file}")
    else:
        print(f"   ❌ {file} MISSING!")

# Check routes directory
routes_dir = backend_dir / 'routes'
if routes_dir.exists():
    route_files = list(routes_dir.glob('*.py'))
    print(f"   ✅ routes/ directory ({len(route_files)} files)")
else:
    print("   ❌ routes/ directory MISSING!")
print()

# 7. Try importing the app
print("7️⃣  Application Import Test:")
try:
    sys.path.insert(0, str(backend_dir))
    from main import app
    print("   ✅ FastAPI app imported successfully")
    print(f"   Title: {app.title}")
    print(f"   Version: {app.version}")
    print(f"   Routes: {len(app.routes)}")
except Exception as e:
    print(f"   ❌ Failed to import app: {str(e)}")
    import traceback
    traceback.print_exc()
print()

# 8. Final recommendation
print("=" * 60)
print("🎯 Summary:")
print("=" * 60)

if missing_packages:
    print("⚠️  ACTION REQUIRED: Install missing dependencies")
    print("   Run: pip install -r requirements.txt")
elif not env_file.exists():
    print("⚠️  ACTION REQUIRED: Configure environment variables")
    print("   1. Copy .env.example to .env")
    print("   2. Fill in all required API keys and credentials")
else:
    print("✅ Backend is ready to start!")
    print()
    print("📡 To start the server, run:")
    print("   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print()
    print("🌐 Server will be available at:")
    print("   - API: http://localhost:8000")
    print("   - Docs: http://localhost:8000/docs")
    print("   - Health: http://localhost:8000/health")

print("=" * 60)
