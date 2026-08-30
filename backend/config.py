import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory or project root
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

def reload_env():
    load_dotenv(BACKEND_DIR / ".env", override=True)
    load_dotenv(PROJECT_ROOT / ".env", override=True)

reload_env()

# Server Config
HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
PORT = int(os.getenv("BACKEND_PORT", os.getenv("PORT", "8000")))

# CORS Origins
raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# Storage Paths
STORAGE_DIR = BACKEND_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
FRAMES_DIR = STORAGE_DIR / "frames"
SAMPLES_DIR = STORAGE_DIR / "samples"
DB_PATH = STORAGE_DIR / "visioniq.db"

for directory in [STORAGE_DIR, UPLOADS_DIR, FRAMES_DIR, SAMPLES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

def get_gemini_key() -> str | None:
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

def get_anthropic_key() -> str | None:
    return os.getenv("ANTHROPIC_API_KEY")

def get_openai_key() -> str | None:
    return os.getenv("OPENAI_API_KEY")

# Active AI provider resolution (dynamically checks environment on every call)
def get_active_provider() -> tuple[str, str]:
    """Returns (provider_name, model_name)"""
    gemini_key = get_gemini_key()
    anthropic_key = get_anthropic_key()
    openai_key = get_openai_key()

    if gemini_key and len(gemini_key.strip()) > 5:
        return "gemini", "gemini-3.6-flash"
    elif anthropic_key and len(anthropic_key.strip()) > 5:
        return "anthropic", "claude-3-7-sonnet-20250219"
    elif openai_key and len(openai_key.strip()) > 5:
        return "openai", "gpt-4o"
    else:
        return "none", "none"

def persist_api_key(provider: str, key: str):
    """Sets in active environment and persists to backend/.env file."""
    clean_key = key.strip()
    env_map = {
        "gemini": "GEMINI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY"
    }
    env_var = env_map.get(provider.lower(), "GEMINI_API_KEY")
    
    # 1. Update running process environment immediately
    os.environ[env_var] = clean_key
    if env_var == "GEMINI_API_KEY":
        os.environ["GOOGLE_API_KEY"] = clean_key

    # 2. Write to backend/.env
    env_path = BACKEND_DIR / ".env"
    lines = []
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
    found = False
    new_lines = []
    for line in lines:
        if line.startswith(f"{env_var}="):
            new_lines.append(f"{env_var}={clean_key}\n")
            found = True
        else:
            new_lines.append(line)
            
    if not found:
        new_lines.append(f"{env_var}={clean_key}\n")
        
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
