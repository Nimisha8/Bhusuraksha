from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.sensor import (
    SensorStationResponse,
    SensorTelemetrySummary
)
from backend.app.services.sensor_service import sensor_service

router = APIRouter(prefix="/sensors", tags=["In-Situ IoT Geotechnical Sensors"])

@router.get("/stations", response_model=List[SensorStationResponse])
def get_sensor_stations():
    """Returns all registered geotechnical telemetry monitoring stations across NER."""
    return sensor_service.list_stations()

@router.get("/stations/{station_id}", response_model=SensorStationResponse)
def get_sensor_station(station_id: str):
    """Retrieves metadata for a specific sensor station."""
    try:
        return sensor_service.get_station(station_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/stations/{station_id}/telemetry", response_model=SensorTelemetrySummary)
def get_station_telemetry(
    station_id: str,
    hours: int = Query(24, ge=1, le=168, description="History window in hours"),
    rainfall_mm: float = Query(35.0, ge=0.0, description="Correlated rainfall in mm to simulate moisture pressure")
):
    """
    Retrieves high-frequency geotechnical telemetry for a station, including:
    - Vibrating Wire Piezometer pore-water pressure (kPa)
    - Volumetric Water Content (VWC) %
    - Biaxial Tiltmeter angular deflection (degrees)
    - Downslope cumulative displacement (mm)
    """
    try:
        return sensor_service.generate_station_telemetry(station_id, hours, rainfall_mm)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
