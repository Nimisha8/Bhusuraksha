import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.v1.router import api_router
from backend.app.services.notification_service import notification_service

from backend.app.core.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed defaults
    try:
        await init_db()
        await seed_database()
    except Exception as e:
        print(f"[Warning] Database initialization/seeding error: {e}")
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Early Warning and Landslide Risk Monitoring System in the North Eastern Region (SIH26001)",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

import os
from fastapi.staticfiles import StaticFiles

# Mount uploads directory
base_project_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
uploads_path = os.path.join(base_project_dir, "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "GeoSurge-NER Core ASGI",
        "database": settings.DATABASE_URL.split("://")[0]
    }

@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """Real-time bi-directional alert broadcast channel for command centers and field apps."""
    await notification_service.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Respond to client ping / location subscriptions
            await websocket.send_text(json.dumps({"event": "HEARTBEAT_ACK", "message": "Connection active"}))
    except WebSocketDisconnect:
        notification_service.disconnect(websocket)

# Mount built React frontend if dist exists (at the end so API/WS take precedence)
frontend_dist = os.path.join(base_project_dir, "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend_dist")
else:
    @app.get("/")
    def root():
        return {
            "system": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "region": "North Eastern Region (NER), India",
            "docs_url": "/docs",
            "health_url": "/health",
            "status": "OPERATIONAL"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
