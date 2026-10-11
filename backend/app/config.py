import os
from dotenv import load_dotenv

# Load .env from backend directory if present
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(env_path):
    load_dotenv(env_path)


class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_SECRET: str = os.getenv("APP_SECRET", "campusiq-dev-secret-key-32-chars-minimum")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Database: production PostgreSQL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:2006@localhost:5432/campusiq"
    )
    
    # Mail settings
    MAIL_ENABLED: bool = os.getenv("MAIL_ENABLED", "false").lower() in ("true", "1")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "CampusIQ Estate Office <no-reply@campusiq.in>")
    
    # AI & Models
    ML_MODELS_DIR: str = os.getenv(
        "ML_MODELS_DIR",
        os.path.join(os.path.dirname(__file__), "ai", "models")
    )
    SEED_DATA_DIR: str = os.getenv(
        "SEED_DATA_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "seed_data"))
    )


settings = Settings()
