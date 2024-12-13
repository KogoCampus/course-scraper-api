from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter()

@router.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse("static/dist/index.html")