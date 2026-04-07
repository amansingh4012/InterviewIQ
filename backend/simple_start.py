import subprocess
import sys

result = subprocess.run([
    sys.executable, "-m", "uvicorn",
    "main:app", "--reload",
    "--host", "0.0.0.0", "--port", "8000"
], cwd=r"C:\Users\amans\.gemini\antigravity\scratch\InterviewIQ\backend")
