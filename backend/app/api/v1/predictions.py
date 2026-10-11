from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, Body
from backend.app.schemas.prediction import (
    PredictionPointRequest,
    PredictionResponse
)
from backend.app.services.ml_service import ml_service

router = APIRouter(prefix="/predictions", tags=["AI/ML Landslide Hazard Prediction"])

@router.post("/point", response_model=PredictionResponse)
async def predict_point(payload: PredictionPointRequest):
    """
    Computes real-time dynamic landslide susceptibility score (0-100), risk tier,
    and SHAP feature attributions for any specified coordinates in NER.
    """
    return await ml_service.predict_for_coordinate(
        latitude=payload.latitude,
        longitude=payload.longitude,
        slope_degrees=payload.slope_degrees,
        elevation_m=payload.elevation_m,
        twi=payload.twi,
        distance_to_road_m=payload.distance_to_road_m
    )

@router.get("/point", response_model=PredictionResponse)
async def predict_point_get(
    lat: float = Query(..., description="Latitude (e.g. 27.24 for 32nd Mile, Sikkim)"),
    lon: float = Query(..., description="Longitude (e.g. 88.51 for 32nd Mile, Sikkim)"),
    slope: Optional[float] = Query(None, description="Slope angle in degrees (optional override)"),
    twi: Optional[float] = Query(None, description="Topographic Wetness Index (optional override)")
):
    """GET convenience endpoint for dynamic point risk prediction."""
    return await ml_service.predict_for_coordinate(
        latitude=lat,
        longitude=lon,
        slope_degrees=slope,
        twi=twi
    )

@router.get("/zones")
async def get_all_zone_predictions():
    """
    Evaluates dynamic risk scores across all high-vulnerability pilot zones in NER
    by fusing live Open-Meteo precipitation, terrain slope, and geotechnical indicators.
    """
    return await ml_service.predict_for_all_zones()
