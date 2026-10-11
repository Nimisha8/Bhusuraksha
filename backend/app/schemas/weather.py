from typing import List, Optional
from pydantic import BaseModel, Field

class HourlyPrecipitation(BaseModel):
    time: str
    precipitation_mm: float
    rain_probability_pct: Optional[float] = None

class AntecedentPrecipitationIndex(BaseModel):
    rain_1h_mm: float = Field(..., description="Rainfall in the last hour")
    rain_24h_mm: float = Field(..., description="Cumulative 24-hour rainfall")
    rain_72h_mm: float = Field(..., description="Cumulative 72-hour rainfall")
    api_3_day: float = Field(..., description="3-Day Antecedent Precipitation Index (decay k=0.84)")
    api_7_day: float = Field(..., description="7-Day Antecedent Precipitation Index (decay k=0.84)")
    soil_moisture_pct: Optional[float] = Field(None, description="Volumetric soil saturation 0-100%")
    saturation_state: str = Field("NORMAL", description="DRY, NORMAL, SATURATED, SUPERSATURATED")

class CurrentWeatherResponse(BaseModel):
    latitude: float
    longitude: float
    location_hint: str
    temperature_c: float
    relative_humidity_pct: float
    precipitation_mm: float
    wind_speed_kmh: float
    weather_code: int
    weather_description: str
    antecedent_indices: AntecedentPrecipitationIndex
    hourly_forecast: List[HourlyPrecipitation]
