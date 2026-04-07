#!/usr/bin/env python
"""
FastAPI Server Startup Monitor
Starts the InterviewIQ backend server and monitors logs for 30+ seconds
"""

import subprocess
import sys
import os
import time
import json
from pathlib import Path
from datetime import datetime

def monitor_server():
    backend_dir = Path(__file__).parent
    os.chdir(str(backend_dir))
    
    print("=" * 80)
    print("InterviewIQ FastAPI Backend Server - Startup Monitor")
    print("=" * 80)
    print(f"\nStartup Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend Directory: {backend_dir}")
    print(f"Python Executable: {sys.executable}")
    print("\nServer Configuration:")
    print("  Host: 0.0.0.0")
    print("  Port: 8000")
    print("  Reload: Enabled")
    print("\nServer URLs:")
    print("  - Main: http://localhost:8000")
    print("  - API Docs: http://localhost:8000/docs")
    print("  - Health: http://localhost:8000/health")
    print("\n" + "=" * 80)
    print("Starting Uvicorn Server...")
    print("=" * 80 + "\n")
    
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
        # Start process
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        print(f"Server Process ID: {process.pid}\n")
        
        # Monitor for 35 seconds
        start_time = time.time()
        monitoring_duration = 35
        output_lines = []
        errors = []
        has_database_msg = False
        has_startup_complete = False
        
        while time.time() - start_time < monitoring_duration and process.poll() is None:
            try:
                line = process.stdout.readline()
                if line:
                    line = line.rstrip()
                    print(line)
                    output_lines.append(line)
                    
                    # Analyze log lines
                    line_lower = line.lower()
                    if "error" in line_lower or "exception" in line_lower or "traceback" in line_lower:
                        errors.append(line)
                    if "database" in line_lower or "connected" in line_lower:
                        has_database_msg = True
                    if "uvicorn running" in line_lower or "application startup complete" in line_lower:
                        has_startup_complete = True
                else:
                    time.sleep(0.01)
            except Exception as e:
                print(f"Error reading output: {e}")
                time.sleep(0.1)
        
        elapsed = time.time() - start_time
        is_running = process.poll() is None
        
        print("\n" + "=" * 80)
        print("STARTUP MONITORING REPORT")
        print("=" * 80)
        print(f"\nMonitoring Duration: {elapsed:.1f} seconds")
        print(f"Process ID: {process.pid}")
        print(f"Server Status: {'✓ RUNNING' if is_running else '✗ EXITED'}")
        
        if has_startup_complete:
            print(f"Server Startup: ✓ COMPLETE")
        else:
            print(f"Server Startup: ? UNKNOWN (still initializing)")
        
        print(f"Database Connection: {'✓ DETECTED' if has_database_msg else '? UNKNOWN'}")
        print(f"Errors/Warnings: {len(errors)}")
        
        if errors:
            print("\nDetected Issues:")
            for i, error in enumerate(errors[:10], 1):
                print(f"  {i}. {error[:100]}{'...' if len(error) > 100 else ''}")
        
        print(f"\nTotal Log Lines: {len(output_lines)}")
        print("\n" + "=" * 80)
        print("NEXT STEPS")
        print("=" * 80)
        print("\nServer is running in the background.")
        print("You can now:")
        print("  1. Test the server: curl http://localhost:8000/health")
        print("  2. View API docs: http://localhost:8000/docs")
        print("  3. Check logs for any issues above")
        print("\nTo stop the server: Press Ctrl+C in the server terminal window")
        print("=" * 80 + "\n")
        
        # Keep process running
        print("Server process will continue running in background...")
        process.wait()
        
    except KeyboardInterrupt:
        print("\n\nShutdown requested by user")
        process.terminate()
        process.wait(timeout=5)
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    monitor_server()
