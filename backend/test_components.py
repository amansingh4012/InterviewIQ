"""
Component-Level Testing Script
Tests individual backend components to identify issues
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

print("🧪 InterviewIQ Component Testing Suite")
print("=" * 60)
print()

# Test 1: Configuration Loading
print("1️⃣  Testing Configuration...")
try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    from config import settings
    print("   ✅ Config loaded successfully")
    print(f"   Database: {settings.mongodb_db_name}")
    print(f"   Frontend URL: {settings.frontend_url}")
except Exception as e:
    print(f"   ❌ Config failed: {e}")
    import traceback
    traceback.print_exc()
print()

# Test 2: Database Connection
print("2️⃣  Testing Database Connection...")
try:
    from database import client, db, sessions_collection
    
    async def test_db():
        try:
            # Ping database
            await client.admin.command('ping')
            print("   ✅ Database ping successful")
            
            # List collections
            collections = await db.list_collection_names()
            print(f"   Collections: {collections if collections else 'None (will be created)'}")
            
            # Test a simple query
            count = await sessions_collection.count_documents({})
            print(f"   Sessions count: {count}")
            
            return True
        except Exception as e:
            print(f"   ❌ Database test failed: {e}")
            return False
    
    result = asyncio.run(test_db())
except Exception as e:
    print(f"   ❌ Database module failed: {e}")
    import traceback
    traceback.print_exc()
print()

# Test 3: FastAPI App Initialization
print("3️⃣  Testing FastAPI App...")
try:
    from main import app
    print("   ✅ App created successfully")
    print(f"   Title: {app.title}")
    print(f"   Version: {app.version}")
    
    # List routes
    routes = [route.path for route in app.routes if hasattr(route, 'path')]
    print(f"   Routes count: {len(routes)}")
    print(f"   Sample routes: {routes[:5]}")
except Exception as e:
    print(f"   ❌ App initialization failed: {e}")
    import traceback
    traceback.print_exc()
print()

# Test 4: Route Modules
print("4️⃣  Testing Route Modules...")
route_modules = ['resume', 'interview', 'voice', 'analytics', 'evaluation', 'subscription']
for module_name in route_modules:
    try:
        module = __import__(f'routes.{module_name}', fromlist=['router'])
        print(f"   ✅ routes.{module_name} - {len(module.router.routes)} endpoints")
    except Exception as e:
        print(f"   ❌ routes.{module_name} - {e}")
print()

# Test 5: Service Modules
print("5️⃣  Testing Service Modules...")
try:
    services_dir = backend_dir / 'services'
    if services_dir.exists():
        service_files = list(services_dir.glob('*.py'))
        for service_file in service_files:
            if service_file.stem != '__init__':
                try:
                    module_name = service_file.stem
                    __import__(f'services.{module_name}')
                    print(f"   ✅ services.{module_name}")
                except Exception as e:
                    print(f"   ⚠️  services.{module_name} - {e}")
    else:
        print("   ⚠️  services/ directory not found")
except Exception as e:
    print(f"   ❌ Service testing failed: {e}")
print()

# Test 6: External API Keys
print("6️⃣  Testing External API Configurations...")
try:
    import os
    
    # Groq API
    groq_key = os.getenv('GROQ_API_KEY', '')
    if groq_key and len(groq_key) > 10:
        print(f"   ✅ Groq API Key configured ({len(groq_key)} chars)")
    else:
        print("   ⚠️  Groq API Key missing or invalid")
    
    # ElevenLabs
    el_key = os.getenv('ELEVENLABS_API_KEY', '')
    el_voice = os.getenv('ELEVENLABS_VOICE_ID', '')
    if el_key and len(el_key) > 10:
        print(f"   ✅ ElevenLabs API Key configured ({len(el_key)} chars)")
        if el_voice:
            print(f"   ✅ ElevenLabs Voice ID: {el_voice[:20]}...")
        else:
            print("   ⚠️  ElevenLabs Voice ID missing")
    else:
        print("   ⚠️  ElevenLabs API Key missing")
    
    # Clerk
    clerk_secret = os.getenv('CLERK_SECRET_KEY', '')
    clerk_jwt = os.getenv('CLERK_JWT_PUBLIC_KEY', '')
    if clerk_secret and len(clerk_secret) > 10:
        print(f"   ✅ Clerk Secret Key configured ({len(clerk_secret)} chars)")
    else:
        print("   ⚠️  Clerk Secret Key missing")
    
    if clerk_jwt and len(clerk_jwt) > 10:
        print(f"   ✅ Clerk JWT Public Key configured ({len(clerk_jwt)} chars)")
    else:
        print("   ⚠️  Clerk JWT Public Key missing")
        
except Exception as e:
    print(f"   ❌ API key check failed: {e}")
print()

# Test 7: Model Imports
print("7️⃣  Testing Data Models...")
try:
    models_dir = backend_dir / 'models'
    if models_dir.exists():
        model_files = list(models_dir.glob('*.py'))
        for model_file in model_files:
            if model_file.stem != '__init__':
                try:
                    module_name = model_file.stem
                    __import__(f'models.{module_name}')
                    print(f"   ✅ models.{module_name}")
                except Exception as e:
                    print(f"   ⚠️  models.{module_name} - {e}")
    else:
        print("   ⚠️  models/ directory not found")
except Exception as e:
    print(f"   ❌ Model testing failed: {e}")
print()

# Test 8: Dependency Versions
print("8️⃣  Checking Critical Dependencies...")
critical_deps = {
    'fastapi': '0.111.0',
    'uvicorn': '0.29.0',
    'motor': '3.4.0',
    'pydantic': '2.7.1'
}

for package, expected_version in critical_deps.items():
    try:
        module = __import__(package.replace('-', '_'))
        actual_version = getattr(module, '__version__', 'Unknown')
        if actual_version:
            print(f"   ✅ {package}: {actual_version}")
        else:
            print(f"   ⚠️  {package}: version unknown")
    except ImportError:
        print(f"   ❌ {package}: NOT INSTALLED")
print()

# Summary
print("=" * 60)
print("📊 Test Summary:")
print("=" * 60)
print()
print("If all tests show ✅, your backend is ready to start!")
print()
print("To start the server:")
print("  python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
print()
print("Or use the batch file:")
print("  start_backend_debug.bat")
print()
print("=" * 60)
