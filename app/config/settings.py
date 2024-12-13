from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # AWS Configuration
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-west-2"
    S3_BUCKET: str = "production-course-scraper"

    # Flower Configuration
    FLOWER_URL: str = "http://localhost:5555"
    FLOWER_BASIC_AUTH_USERNAME: str = "admin"
    FLOWER_BASIC_AUTH_PASSWORD: str = "password"

    # Admin credentials
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "password"

    # Student Manager Configuration
    STUDENT_MANAGER_URL: str = "https://api.staging.kogocampus.com/student/"

    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8'
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings() 