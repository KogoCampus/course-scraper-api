from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api import courses, admin, ui

app = FastAPI(title="Course Scraper API")

# Mount static files first (CSS, images, etc.)
app.mount("/static/css", StaticFiles(directory="static/css"), name="css")
app.mount("/assets", StaticFiles(directory="static/dist/assets"), name="assets")

# Include routers
app.include_router(courses.router, prefix="/api", tags=["courses"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ui.router, tags=["ui"])

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse("static/dist/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 