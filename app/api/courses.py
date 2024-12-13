from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import json
import boto3
from app.core.storage import redis_client, s3_client
from app.config.settings import settings
from botocore.exceptions import ClientError
from app.core.auth import authenticate
from typing import Dict, Any
from pydantic import BaseModel

router = APIRouter(tags=["Courses"])

class CourseResponse(BaseModel):
    """Course data response model"""
    class Config:
        json_schema_extra = {
            "example": {
                "courses": [
                    {
                        "code": "CMPT 120",
                        "title": "Introduction to Computing Science and Programming I",
                        "units": 3,
                        "description": "An elementary introduction to computing science and computer programming...",
                        "prerequisites": ["Grade 12 Computer Science or equivalent"],
                        "sections": [
                            {
                                "type": "LEC",
                                "section": "D100",
                                "instructor": "John Doe",
                                "schedule": ["Mon 10:30-12:20", "Wed 10:30-11:20"],
                                "location": "AQ 3150",
                                "enrollment": {"current": 120, "total": 150}
                            }
                        ]
                    }
                ],
                "metadata": {
                    "school": "SFU",
                    "term": "Spring 2024",
                    "last_updated": "2024-01-10T12:00:00Z"
                }
            }
        }

@router.get(
    "/course-listing/{school_name}",
    response_model=CourseResponse,
    responses={
        200: {
            "description": "Successfully retrieved course listing",
            "content": {
                "application/json": {
                    "example": CourseResponse.Config.json_schema_extra["example"]
                }
            }
        },
        401: {
            "description": "Authentication failed - Invalid or missing token",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid or expired token"}
                }
            }
        },
        404: {
            "description": "School not found",
            "content": {
                "application/json": {
                    "example": {"detail": "School not found"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Error retrieving course data"}
                }
            }
        }
    }
)
async def get_course_listing(
    school_name: str,
    auth_info: dict = Depends(authenticate)
):
    """
    Get course listing for a specific school.
    
    Parameters:
    - **school_name**: Name of the school to get course listing for
    
    Returns:
    - Course listing data including courses and metadata
    
    Authentication:
    - Requires either admin credentials or a valid student token
    - Student tokens are validated against the student manager service
    
    Notes:
    - Course data is fetched from S3 storage
    - School mapping is stored in Redis
    """
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
    