import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Student Management System"
    API_VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str
    
    # JWT Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email / SMTP
    MAIL_SERVER: str
    MAIL_PORT: int = 587
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    
    # Admin Seed Data
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    # Load from .env file
    # Note: env_file is relative to the directory where the app is run
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

# Initialize settings
settings = Settings()

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("leximind-ai")
