# core/config.py
import os

class Settings:
    PROJECT_NAME: str = "HealNexus System"
    PROJECT_VERSION: str = "1.0.0"
    
    # Update this if your XAMPP MySQL has a password
    DATABASE_URL: str = "mysql+pymysql://root:@localhost/healnexus_db"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "healnexus_super_secret_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()