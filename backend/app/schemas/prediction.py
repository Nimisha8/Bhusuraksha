from typing import List, Optional
from pydantic import BaseModel, Field

class ShapFactor(BaseModel):
    factor_name: str
    contribution_score: float # positive increases risk, negative decreases
    percentage: float
    description: str

class PredictionPointRequest(BaseModel):
    latitude: float
    longitude: float
    elevation_m: Optional[float] = None
    slope_degrees: Optional[float] = None
    twi: Optional[float] = None
    distance_to_road_m: Optional[float] = None

class PredictionResponse(BaseModel):
    latitude: float
    longitude: float
    landslide_probability: float = Field(..., ge=0.0, le=1.0)
    risk_score_100: float = Field(..., ge=0.0, le=100.0)
    risk_tier: str # LOW, MODERATE, HIGH, CRITICAL
    color_code: str # GREEN, YELLOW, ORANGE, RED
    rain_1h_mm: float
    rain_24h_mm: float
    api_7_day: float
    soil_saturation_pct: float
    shap_top_drivers: List[ShapFactor]
    alert_triggered: bool
    recommended_action: str
