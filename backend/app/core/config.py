import os
from typing import List, Dict, Any
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = ConfigDict(extra="allow", env_file=".env")

    PROJECT_NAME: str = "GeoSurge-NER: AI Landslide Early Warning System"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "geosurge-ner-secret-key-sih2026-secure-token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database: Supports SQLite (for zero-setup dev) and PostgreSQL/PostGIS (for prod)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./geosurge_landslide.db"
    )
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Weather Integration
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    # Pilot Corridors & Coordinates in NER
    PILOT_LOCATIONS: Dict[str, Any] = {
        "sikkim_nh10": {
            "name": "Gangtok - Sevoke Corridor (NH-10)",
            "state": "Sikkim",
            "lat": 27.3389,
            "lon": 88.6065,
            "elevation_m": 1650,
            "vulnerability_tier": "CRITICAL"
        },
        "meghalaya_nh6": {
            "name": "Guwahati - Shillong Corridor (NH-6)",
            "state": "Meghalaya",
            "lat": 25.5788,
            "lon": 91.8933,
            "elevation_m": 1525,
            "vulnerability_tier": "HIGH"
        },
        "nagaland_nh29": {
            "name": "Kohima - Dimapur Corridor (NH-29)",
            "state": "Nagaland",
            "lat": 25.6751,
            "lon": 94.1086,
            "elevation_m": 1444,
            "vulnerability_tier": "CRITICAL"
        },
        "assam_dima_hasao": {
            "name": "Haflong - Lumding Hill Section",
            "state": "Assam",
            "lat": 25.1764,
            "lon": 93.0232,
            "elevation_m": 680,
            "vulnerability_tier": "HIGH"
        }
    }

settings = Settings()
