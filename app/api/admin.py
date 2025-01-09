import json
import httpx
import redis
from fastapi import APIRouter, HTTPException, Request, Query, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional
from base64 import b64encode
from datetime import datetime

from app.core.storage import redis_client, s3_client
from app.config.settings import settings
from app.core.auth import verify_admin_auth
from app.api.courses import get_course_listing


router = APIRouter(dependencies=[Depends(verify_admin_auth)])

@router.get("/s3-list")
async def list_s3_contents(
    prefix: Optional[str] = Query(None, description="S3 prefix to list"),
    continuation_token: Optional[str] = Query(None),
    max_keys: int = Query(1000, ge=1, le=1000)
):
    try:
        prefix = prefix or ""
        if prefix and not prefix.endswith('/'):
            prefix += '/'

        params = {
            "Bucket": settings.S3_BUCKET,
            "Prefix": prefix,
            "Delimiter": '/',
            "MaxKeys": max_keys
        }
        
        if continuation_token:
            params["ContinuationToken"] = continuation_token

        response = s3_client.list_objects_v2(**params)

        # Process directories (common prefixes)
        directories = [
            {
                "name": p["Prefix"].rstrip('/').split('/')[-1] or p["Prefix"],
                "path": p["Prefix"],
                "type": "directory"
            }
            for p in response.get("CommonPrefixes", [])
        ]

        # Process files
        files = [
            {
                "name": obj["Key"].split('/')[-1],
                "path": obj["Key"],
                "size": obj["Size"],
                "last_modified": obj["LastModified"].isoformat(),
                "type": "file"
            }
            for obj in response.get("Contents", [])
            if not obj["Key"].endswith('/')
            and (not prefix or obj["Key"] != prefix)
        ]

        return JSONResponse(content={
            "items": directories + files,
            "pagination": {
                "is_truncated": response.get("IsTruncated", False),
                "next_continuation_token": response.get("NextContinuationToken"),
                "key_count": response.get("KeyCount", 0)
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
                if s3_key:
                    schools.append({
                        "name": school_name,
                        "course_data_path": s3_key
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

@router.post("/flower-tasks")
async def create_flower_task(task_name: str = Form(...)):
    """Create a new Flower task"""
    try:
        # Create basic auth header
        credentials = f"{settings.FLOWER_BASIC_AUTH_USERNAME}:{settings.FLOWER_BASIC_AUTH_PASSWORD}"
        auth_header = b64encode(credentials.encode()).decode()

        async with httpx.AsyncClient() as client:
            # Create task
            response = await client.post(
                f"{settings.FLOWER_URL}/api/task/async-apply/scraper_task",
                headers={
                    "Authorization": f"Basic {auth_header}",
                    "Content-Type": "application/json"
                },
                json={"args": [task_name]}
            )
            
            if response.status_code == 200:
                task_data = response.json()
                task_id = task_data.get('task-id')
                
                # Get task status
                status_response = await client.get(
                    f"{settings.FLOWER_URL}/api/task/info/{task_id}",
                    headers={"Authorization": f"Basic {auth_header}"}
                )
                
                task_status = "PENDING"
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    task_status = status_data.get('state', 'PENDING')

                # Store task in Redis
                task_key = f"flower_task:{task_name}"
                task_data = {
                    "task_name": task_name,
                    "task_id": task_id,
                    "timestamp": datetime.now().isoformat(),
                    "status": task_status
                }
                redis_client.hset(task_key, mapping=task_data)
                
                return JSONResponse(content={
                    "status": "success",
                    "message": f"Task '{task_name}' created successfully",
                    "data": {
                        "task_id": task_id,
                        "task_status": task_status
                    }
                })
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to create task: {response.text}"
                )
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating Flower task: {str(e)}"
        )

@router.get("/flower-tasks")
async def list_flower_tasks(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50)
):
    """List Flower tasks with fresh data"""
    try:
        # Get task IDs from Redis (we still need this to know what tasks exist)
        task_keys = redis_client.keys("flower_task:*")
        tasks = []
        
        # Create basic auth header for Flower
        credentials = f"{settings.FLOWER_BASIC_AUTH_USERNAME}:{settings.FLOWER_BASIC_AUTH_PASSWORD}"
        auth_header = b64encode(credentials.encode()).decode()
        
        # Fetch fresh status for each task
        async with httpx.AsyncClient() as client:
            for key in task_keys:
                task_data = redis_client.hgetall(key)
                if not task_data or 'task_id' not in task_data:
                    continue
                    
                # Get fresh task status from Flower
                response = await client.get(
                    f"{settings.FLOWER_URL}/api/task/info/{task_data['task_id']}",
                    headers={"Authorization": f"Basic {auth_header}"}
                )
                
                if response.status_code == 200:
                    flower_data = response.json()
                    tasks.append({
                        "task_name": task_data['task_name'],
                        "task_id": task_data['task_id'],
                        "timestamp": task_data['timestamp'],
                        "status": flower_data.get('state', 'UNKNOWN'),
                        "result": flower_data.get('result'),
                        "runtime": flower_data.get('runtime'),
                        "worker": flower_data.get('worker')
                    })
        
        # Sort tasks by timestamp (newest first)
        tasks.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Calculate pagination
        total_items = len(tasks)
        total_pages = (total_items + per_page - 1) // per_page
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        return JSONResponse(content={
            "tasks": tasks[start_idx:end_idx],
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total_items": total_items,
                "total_pages": total_pages
            }
        })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching Flower tasks: {str(e)}"
        )

@router.get("/flower-tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a specific task"""
    try:
        credentials = f"{settings.FLOWER_BASIC_AUTH_USERNAME}:{settings.FLOWER_BASIC_AUTH_PASSWORD}"
        auth_header = b64encode(credentials.encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.FLOWER_URL}/api/task/info/{task_id}",
                headers={"Authorization": f"Basic {auth_header}"}
            )
            
            if response.status_code == 200:
                status_data = response.json()
                return JSONResponse(content=status_data)
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch task status"
                )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching task status: {str(e)}"
        ) 

async def check_flower_health():
    """Check if Flower is available"""
    try:
        credentials = f"{settings.FLOWER_BASIC_AUTH_USERNAME}:{settings.FLOWER_BASIC_AUTH_PASSWORD}"
        auth_header = b64encode(credentials.encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.FLOWER_URL}/metrics",
                headers={"Authorization": f"Basic {auth_header}"},
                timeout=5.0  # 5 seconds timeout
            )
            return response.status_code == 200
    except Exception:
        return False

@router.get("/flower-health")
async def get_flower_health():
    """Get Flower service health status"""
    is_healthy = await check_flower_health()
    return JSONResponse(content={
        "healthy": is_healthy,
        "flower_url": settings.FLOWER_URL
    })

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