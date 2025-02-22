from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.api import courses, admin


app = FastAPI(
    title="Course Scraper API",
    description="API for managing and accessing schools data.",
    version="1.0.0"
)

# CORS configuration
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Include routers
app.include_router(courses.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin")

# Mount static files from dist/assets
app.mount("/assets", StaticFiles(directory="ui/dist/assets"), name="assets")

# Serve SPA for all other routes
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse("ui/dist/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 