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
    
    # Mail & Resend settings
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    RESEND_FROM: str = os.getenv("RESEND_FROM", "CampusIQ <onboarding@resend.dev>")
    MAIL_ENABLED: bool = os.getenv("MAIL_ENABLED", "true" if os.getenv("RESEND_API_KEY") else "false").lower() in ("true", "1")
    MAIL_FROM: str = os.getenv("MAIL_FROM", os.getenv("RESEND_FROM", "CampusIQ <onboarding@resend.dev>"))
    
    # S3 Object Storage
    AWS_ENDPOINT_URL_S3: str = os.getenv("AWS_ENDPOINT_URL_S3", "")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "evidences")

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
