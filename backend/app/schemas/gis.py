from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class RiskZoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    zone_code: str
    name: str
    state: str
    district: str
    corridor_name: Optional[str] = None
    latitude: float
    longitude: float
    elevation_m: float
    slope_degrees: float
    aspect: str
    soil_type: str
    twi: float
    distance_to_road_m: float
    road_criticality: int
    population_exposure: int
    baseline_hazard_score: float
    current_hazard_score: float
    risk_tier: str
    geojson_geometry: Optional[str] = None

class RoadSegmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    road_code: str # e.g. NH-10, NH-29, NH-6
    name: str
    state: str
    section_name: str
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    length_km: float
    status: str # OPEN, RESTRICTED, BLOCKED
    cut_slope_hazard: str # LOW, MODERATE, CRITICAL
    criticality_tier: int # 1 to 5
    bypass_available: bool

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
