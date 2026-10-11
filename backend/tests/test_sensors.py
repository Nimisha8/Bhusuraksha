import pytest
from backend.app.services.sensor_service import sensor_service

def test_list_stations():
    stations = sensor_service.list_stations()
    assert len(stations) >= 3
    station_ids = [s.id for s in stations]
    assert "SEN-SKM-NH10-01" in station_ids

def test_generate_station_telemetry():
    station_id = "SEN-SKM-NH10-01"
    telemetry = sensor_service.generate_station_telemetry(station_id, hours=12, simulated_rainfall_mm=65.0)
    
    assert telemetry.station_id == station_id
    assert len(telemetry.history) == 12
    assert telemetry.current_pore_pressure > 0.0
    assert telemetry.pore_pressure_status in ["NORMAL", "ELEVATED", "CRITICAL"]
    assert telemetry.current_displacement_mm > 0.0
    assert telemetry.displacement_rate_mm_hr >= 0.0
