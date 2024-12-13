from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api import courses, admin, ui

app = FastAPI(
    title="Course Scraper API",
    description="API for managing and accessing course data from various schools",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files first (CSS, images, etc.)
app.mount("/static/css", StaticFiles(directory="static/css"), name="css")
app.mount("/assets", StaticFiles(directory="static/dist/assets"), name="assets")

# Include routers
app.include_router(courses.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin")
app.include_router(ui.router)

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse("static/dist/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 