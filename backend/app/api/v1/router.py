from fastapi import APIRouter
from backend.app.api.v1.weather import router as weather_router
from backend.app.api.v1.sensors import router as sensors_router
from backend.app.api.v1.gis import router as gis_router
from backend.app.api.v1.predictions import router as predictions_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.emergency import router as emergency_router
from backend.app.api.v1.alerts import router as alerts_router

api_router = APIRouter()

api_router.include_router(weather_router)
api_router.include_router(sensors_router)
api_router.include_router(gis_router)
api_router.include_router(predictions_router)
api_router.include_router(reports_router)
api_router.include_router(emergency_router)
api_router.include_router(alerts_router)
