import boto3
import redis
from fastapi import HTTPException

from app.config.settings import settings


# Redis client with connection checking
def get_redis_client():
    try:
        client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True
        )
        # Test connection
        client.ping()
        return client
    except redis.ConnectionError as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to Redis database"
        )

# S3 client
s3_client = boto3.client(
    's3',
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)

# Initialize Redis client
redis_client = get_redis_client() 