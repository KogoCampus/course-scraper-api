from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import json
import boto3
from app.core.storage import redis_client, s3_client
from app.config.settings import settings
from botocore.exceptions import ClientError
from app.core.auth import authenticate

router = APIRouter()

@router.get("/course-listing/{school_name}")
async def get_course_listing(
    school_name: str,
    auth_info: dict = Depends(authenticate)
):
    # Try to get the S3 key from Redis
    s3_key = redis_client.get(f"school:{school_name}")
    
    if not s3_key:
        raise HTTPException(status_code=404, detail="School not found")
    
    try:
        # Get the file from S3
        response = s3_client.get_object(Bucket=settings.S3_BUCKET, Key=s3_key)
        course_data = json.loads(response['Body'].read().decode('utf-8'))
        return JSONResponse(content=course_data)
    except ClientError as e:
        raise HTTPException(status_code=500, detail="Error retrieving course data")
    