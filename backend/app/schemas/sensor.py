from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class SensorStationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    zone_code: str
    latitude: float
    longitude: float
    elevation_m: float
    sensor_types: str
    status: str
    battery_level_pct: float
    last_heartbeat: datetime

class SensorReadingCreate(BaseModel):
    station_id: str
    pore_water_pressure_kpa: float = Field(..., description="Pore-water pressure in kPa (threshold ~30-45 kPa)")
    soil_moisture_vwc: float = Field(..., description="Volumetric water content percentage (0-100%)")
    tilt_angle_x: float = Field(..., description="Angular deviation X in degrees")
    tilt_angle_y: float = Field(..., description="Angular deviation Y in degrees")
    surface_displacement_mm: float = Field(..., description="Downslope cumulative displacement in mm")
    temperature_c: Optional[float] = 20.0

class SensorReadingResponse(SensorReadingCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime

class SensorTelemetrySummary(BaseModel):
    station_id: str
    station_name: str
    status: str
    current_pore_pressure: float
    pore_pressure_status: str # NORMAL, ELEVATED, CRITICAL
    current_displacement_mm: float
    displacement_rate_mm_hr: float
    history: List[SensorReadingResponse]
