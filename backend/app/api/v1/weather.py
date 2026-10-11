from typing import Dict, Any, List
from fastapi import APIRouter, Query
from backend.app.core.config import settings
from backend.app.schemas.weather import CurrentWeatherResponse
from backend.app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather & Precipitation"])

@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    lat: float = Query(..., description="Latitude (e.g. 27.3389 for Gangtok, Sikkim)"),
    lon: float = Query(..., description="Longitude (e.g. 88.6065 for Gangtok, Sikkim)"),
    location: str = Query("North Eastern Region", description="Location name or corridor description")
):
    """
    Fetches real-time weather, 7-day antecedent rainfall history, and computes the
    Antecedent Precipitation Index (API-7 & API-3) for any coordinate in the NER.
    """
    return await weather_service.fetch_weather_and_antecedent(lat, lon, location)

@router.get("/pilot-corridors")
async def get_pilot_corridors_weather():
    """
    Returns live weather and antecedent hydrologic metrics for key NER lifeline corridors:
    - NH-10 Gangtok - Sevoke (Sikkim)
    - NH-6 Guwahati - Shillong (Assam / Meghalaya)
    - NH-29 Dimapur - Kohima (Nagaland)
    - Haflong - Lumding Hill Section (Assam Dima Hasao)
    """
    corridor_summaries = []
    for key, loc in settings.PILOT_LOCATIONS.items():
        res = await weather_service.fetch_weather_and_antecedent(
            loc["lat"], 
            loc["lon"], 
            loc["name"]
        )
        corridor_summaries.append({
            "key": key,
            "corridor_name": loc["name"],
            "state": loc["state"],
            "vulnerability_tier": loc["vulnerability_tier"],
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "current_temp_c": res.temperature_c,
            "current_rain_mm": res.precipitation_mm,
            "rain_24h_mm": res.antecedent_indices.rain_24h_mm,
            "rain_72h_mm": res.antecedent_indices.rain_72h_mm,
            "api_7_day": res.antecedent_indices.api_7_day,
            "soil_saturation_pct": res.antecedent_indices.soil_moisture_pct,
            "saturation_state": res.antecedent_indices.saturation_state,
            "weather_description": res.weather_description
        })
    return corridor_summaries
