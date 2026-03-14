from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import debate, voice, mun, admin
import os

from database import engine, Base
from models import db_models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Clarivox",
    description="An AI-powered debate coach and MUN simulation platform that challenges your arguments and scores your performance.",
    version="1.0.0"
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(debate.router)
app.include_router(voice.router)
app.include_router(mun.router)
app.include_router(admin.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": "Clarivox"}

# Serve specific API endpoints if there are any that overlap with frontend
# (handled by routers above)

# Mount the 'dist' directory created by Vite build
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")
    
    # Catch-all route to let React Router handle client-side routing
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # We try to serve specific files from dist root if they exist (vite.svg, etc)
        file_path = os.path.join(frontend_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Otherwise, return index.html for React Router SPA behavior
        return FileResponse(os.path.join(frontend_dir, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "message": "Clarivox API is running, but frontend/dist was not found. Please run 'npm run build' in the frontend directory.",
            "docs": "/docs",
            "health": "/health"
        }
