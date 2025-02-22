import json
import httpx
import redis
from fastapi import APIRouter, HTTPException, Request, Query, Form, Depends, Body
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
from base64 import b64encode
from datetime import datetime

from app.core.storage import redis_client, s3_client
from app.config.settings import settings
from app.core.auth import verify_admin_auth
from app.api.courses import get_course_listing


router = APIRouter(dependencies=[Depends(verify_admin_auth)])

@router.get("/s3-preview/{s3_key:path}")
async def preview_s3_file(s3_key: str):
    try:
        response = s3_client.get_object(Bucket=settings.S3_BUCKET, Key=s3_key)
        content = json.loads(response['Body'].read().decode('utf-8'))
        return JSONResponse(content=content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/school-entries")
async def create_school_entry(
    school_name: str = Form(...),
    course_data_path: str = Form(...),
    update_existing: bool = Form(False, description="Set to true to update existing entry")
):
    """Create or update a school entry mapping to S3 course data"""
    try:
        redis_client.ping()
        
        # Check if school already exists
        key = f"school:{school_name}"
        exists = redis_client.exists(key)
        
        if exists and not update_existing:
            raise HTTPException(
                status_code=400,
                detail="School entry already exists. Set update_existing=true to update."
            )
        
        # Verify the file exists in S3
        try:
            s3_client.head_object(Bucket=settings.S3_BUCKET, Key=course_data_path)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid S3 file path or file does not exist: {str(e)}"
            )

        # Save/update the mapping in Redis
        redis_client.set(key, course_data_path)

        return JSONResponse(content={
            "status": "success",
            "message": f"School entry {'updated' if exists else 'created'} for {school_name}",
            "data": {
                "school_name": school_name,
                "course_data_path": course_data_path,
                "action": "updated" if exists else "created"
            }
        })
    except HTTPException:
        raise
    except redis.ConnectionError:
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to Redis database"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error managing school entry: {str(e)}"
        )

@router.get("/school-entries")
async def list_school_entries(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    search: str = Query(None)
):
    try:
        redis_client.ping()
        school_keys = redis_client.keys("school:*")
        schools = []
        
        for key in school_keys:
            try:
                school_name = key.split(':')[1]
                s3_key = redis_client.get(key)
                updated_at = redis_client.get(f"school:{school_name}:updated_at") or None
                if s3_key:
                    schools.append({
                        "name": school_name,
                        "course_data_path": s3_key,
                        "updated_at": updated_at
                    })
            except Exception:
                continue

        # Apply search filter if provided
        if search:
            search = search.lower()
            schools = [
                school for school in schools
                if search in school['name'].lower()
            ]

        # Calculate pagination
        total_items = len(schools)
        total_pages = (total_items + per_page - 1) // per_page
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        return JSONResponse(content={
            "schools": schools[start_idx:end_idx],
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total_items": total_items,
                "total_pages": total_pages
            }
        })
    except redis.ConnectionError:
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to Redis database"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching school entries: {str(e)}"
        ) 

@router.delete("/school-entries/{school_name}")
async def delete_school_entry(school_name: str):
    try:
        redis_client.ping()
        key = f"school:{school_name}"
        
        if not redis_client.exists(key):
            raise HTTPException(
                status_code=404,
                detail=f"School entry '{school_name}' not found"
            )
            
        redis_client.delete(key)
        return JSONResponse(content={
            "status": "success",
            "message": f"School entry '{school_name}' deleted successfully"
        })
    except redis.ConnectionError:
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to Redis database"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting school entry: {str(e)}"
        ) 

@router.get("/test-course-listing/{school_name}")
async def test_course_listing(
    school_name: str,
    admin_user: str = Depends(verify_admin_auth)
):
    """Test course listing API as admin"""
    try:
        # Pass admin auth through to course listing
        # return await get_course_listing(school_name, {"type": "admin"})
        return await get_course_listing(school_name)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/s3-update")
async def update_s3_file(
    file_path: str = Body(..., description="S3 file path to update"),
    content: Dict[str, Any] = Body(..., description="New JSON content")
):
    """Update an existing S3 file with new JSON content"""
    try:
        # Convert content to JSON string
        json_content = json.dumps(content, indent=2)
        
        # Update the file in S3
        s3_client.put_object(
            Bucket=settings.S3_BUCKET,
            Key=file_path,
            Body=json_content,
            ContentType='application/json'
        )

        return JSONResponse(content={
            "status": "success",
            "message": f"File {file_path} updated successfully"
        })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating S3 file: {str(e)}"
        )