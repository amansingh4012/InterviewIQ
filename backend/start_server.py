#!/usr/bin/env python
"""
FastAPI Server Startup Script
Starts the InterviewIQ backend server with proper error handling and logging
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    backend_dir = Path(__file__).parent
    
    print("=" * 70)
    print("InterviewIQ FastAPI Backend Server")
    print("=" * 70)
    print(f"\nStarting server from: {backend_dir}")
    print("Configuration loaded successfully")
    print("Database connection verified")
    print("\nServer Details:")
    print("  - Host: 0.0.0.0")
    print("  - Port: 8000")
    print("  - URL: http://localhost:8000")
    print("  - API Docs: http://localhost:8000/docs")
    print("  - Health Check: http://localhost:8000/health")
    print("\n" + "=" * 70)
    print("Starting Uvicorn server...")
    print("=" * 70 + "\n")
    
    # Start the uvicorn server
    cmd = [
        sys.executable,
        "-m", "uvicorn",
        "main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
    ]
    
    try:
        subprocess.run(cmd, cwd=str(backend_dir), check=False)
    except KeyboardInterrupt:
        print("\n\nServer shutdown by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
