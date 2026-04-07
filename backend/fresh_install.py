"""
Fresh Virtual Environment Setup - Python Script
Alternative to batch file for more control
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(cmd, description, check=True):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"⚙️  {description}")
    print(f"{'='*60}")
    print(f"Command: {cmd}")
    print()
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=check,
            capture_output=False,
            text=True
        )
        print(f"✅ {description} - SUCCESS")
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - FAILED")
        print(f"Error: {e}")
        return False

def main():
    print("="*60)
    print("🔄 InterviewIQ Backend - Fresh Environment Setup")
    print("="*60)
    print()
    print("This script will:")
    print("  1. Delete existing virtual environment")
    print("  2. Create new virtual environment")
    print("  3. Upgrade pip to latest version")
    print("  4. Install fresh packages from requirements.txt")
    print()
    
    # Get backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    print(f"Working directory: {os.getcwd()}")
    print()
    
    # Confirm with user
    response = input("⚠️  This will DELETE your current venv. Continue? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("Cancelled by user.")
        return
    
    # Step 1: Remove old venv
    venv_path = backend_dir / "venv"
    if venv_path.exists():
        print("\n[Step 1/5] Removing old virtual environment...")
        print(f"Deleting: {venv_path}")
        try:
            shutil.rmtree(venv_path)
            print("✅ Old virtual environment removed")
        except Exception as e:
            print(f"❌ Failed to remove venv: {e}")
            print("Please close any Python processes and try again.")
            return
    else:
        print("\n[Step 1/5] No existing venv found, skipping...")
    
    # Step 2: Create new venv
    print("\n[Step 2/5] Creating fresh virtual environment...")
    if not run_command("python -m venv venv", "Creating virtual environment"):
        print("❌ Failed to create virtual environment!")
        return
    
    # Determine python/pip paths in venv
    if sys.platform == "win32":
        python_exe = venv_path / "Scripts" / "python.exe"
        pip_exe = venv_path / "Scripts" / "pip.exe"
    else:
        python_exe = venv_path / "bin" / "python"
        pip_exe = venv_path / "bin" / "pip"
    
    # Step 3: Upgrade pip
    print("\n[Step 3/5] Upgrading pip, setuptools, and wheel...")
    upgrade_cmd = f'"{python_exe}" -m pip install --upgrade pip setuptools wheel'
    run_command(upgrade_cmd, "Upgrading pip tools", check=False)
    
    # Step 4: Check requirements.txt
    print("\n[Step 4/5] Checking requirements.txt...")
    requirements_file = backend_dir / "requirements.txt"
    if not requirements_file.exists():
        print("❌ requirements.txt not found!")
        return
    print(f"✅ Found: {requirements_file}")
    
    # Step 5: Install packages
    print("\n[Step 5/5] Installing packages from requirements.txt...")
    print("⏳ This may take several minutes...")
    print()
    
    install_cmd = f'"{pip_exe}" install -r requirements.txt'
    if not run_command(install_cmd, "Installing packages"):
        print("❌ Package installation failed!")
        print("Check the error messages above.")
        return
    
    # Show installed packages
    print("\n" + "="*60)
    print("📦 Installed Packages:")
    print("="*60)
    list_cmd = f'"{pip_exe}" list --format=columns'
    run_command(list_cmd, "Listing installed packages", check=False)
    
    # Success summary
    print("\n" + "="*60)
    print("🎉 SUCCESS! Fresh Environment Ready")
    print("="*60)
    print()
    print("✅ Virtual environment created")
    print("✅ Pip upgraded to latest version")
    print("✅ All packages installed from requirements.txt")
    print()
    print("Next steps:")
    print("  1. Activate venv: venv\\Scripts\\activate")
    print("  2. Verify setup: python debug_backend.py")
    print("  3. Start server: python -m uvicorn main:app --reload")
    print()
    print("="*60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user (Ctrl+C)")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
