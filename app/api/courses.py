from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import json
import boto3
from botocore.exceptions import ClientError

from app.core.auth import authenticate
from app.core.storage import redis_client, s3_client
from app.config.settings import settings


router = APIRouter()

@router.get("/course-listing")
async def list_available_schools(
    auth_info: dict = Depends(authenticate)
):
    """List all available schools with course listings"""
    try:
        # Get all school entries from Redis
        school_keys = redis_client.keys("school:*")
        schools = []
        
        for key in school_keys:
            try:
                school_name = key.split(':')[1]
                schools.append({
                    "name": school_name,
                    "endpoint": f"/api/course-listing/{school_name}"
                })
            except Exception:
                continue

        # Sort schools by name
        schools.sort(key=lambda x: x['name'])
        
        return JSONResponse(content={
            "schools": schools,
            "total": len(schools)
        })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching available schools: {str(e)}"
        )

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
    