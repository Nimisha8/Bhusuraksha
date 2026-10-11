import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from backend.app.schemas.sensor import (
    SensorStationResponse,
    SensorReadingResponse,
    SensorTelemetrySummary
)

class SensorService:
    def __init__(self):
        # Pre-configured in-situ IoT telemetry monitoring stations along NER lifeline corridors
        self.stations: Dict[str, Dict[str, Any]] = {
            "SEN-SKM-NH10-01": {
                "id": "SEN-SKM-NH10-01",
                "name": "32nd Mile Cut-Slope Geotechnical Station",
                "zone_code": "SKM-NH10-Z1",
                "latitude": 27.2412,
                "longitude": 88.5124,
                "elevation_m": 1280.0,
                "sensor_types": "Vibrating Wire Piezometer, In-Place Inclinometer, Tiltmeter, VWC",
                "status": "ACTIVE",
                "battery_level_pct": 94.5,
                "last_heartbeat": datetime.now(timezone.utc)
            },
            "SEN-SKM-NH10-02": {
                "id": "SEN-SKM-NH10-02",
                "name": "Teesta Bazar Toe-Erosion Station",
                "zone_code": "SKM-NH10-Z2",
                "latitude": 27.0645,
                "longitude": 88.4312,
                "elevation_m": 220.0,
                "sensor_types": "Acoustic Emission, Piezometer, Tiltmeter",
                "status": "WARNING",
                "battery_level_pct": 87.0,
                "last_heartbeat": datetime.now(timezone.utc)
            },
            "SEN-ML-NH6-01": {
                "id": "SEN-ML-NH6-01",
                "name": "Barapani-Umiam Hillside Telemetry Unit",
                "zone_code": "ML-NH6-Z1",
                "latitude": 25.6631,
                "longitude": 91.9056,
                "elevation_m": 1020.0,
                "sensor_types": "Piezometer, Soil Moisture VWC, Biaxial Tiltmeter",
                "status": "ACTIVE",
                "battery_level_pct": 98.2,
                "last_heartbeat": datetime.now(timezone.utc)
            },
            "SEN-NL-NH29-01": {
                "id": "SEN-NL-NH29-01",
                "name": "Zubza Sinking Zone Inclinometer Array",
                "zone_code": "NL-NH29-Z1",
                "latitude": 25.7121,
                "longitude": 94.0322,
                "elevation_m": 1150.0,
                "sensor_types": "Inclinometer, Surface Extensometer, Piezometer",
                "status": "ACTIVE",
                "battery_level_pct": 91.0,
                "last_heartbeat": datetime.now(timezone.utc)
            }
        }

    def list_stations(self) -> List[SensorStationResponse]:
        """Returns all registered sensor monitoring stations."""
        return [SensorStationResponse(**data) for data in self.stations.values()]

    def get_station(self, station_id: str) -> SensorStationResponse:
        """Retrieves metadata for a specific station."""
        data = self.stations.get(station_id)
        if not data:
            raise KeyError(f"Sensor station '{station_id}' not found.")
        return SensorStationResponse(**data)

    def generate_station_telemetry(
        self, 
        station_id: str, 
        hours: int = 24, 
        simulated_rainfall_mm: float = 45.0
    ) -> SensorTelemetrySummary:
        """
        Generates realistic physics-grounded geotechnical telemetry.
        Pore-water pressure and tilt angle are correlated with simulated precipitation.
        """
        station = self.get_station(station_id)
        readings: List[SensorReadingResponse] = []
        now = datetime.now(timezone.utc)

        # Base physical parameters
        is_warning_station = station.status == "WARNING" or simulated_rainfall_mm > 60.0
        base_pore_pressure = 24.0 if is_warning_station else 14.0
        base_displacement = 3.5 if is_warning_station else 0.8
        
        cumulative_displacement = base_displacement

        for h in range(hours, 0, -1):
            ts = now - timedelta(hours=h)
            # Add diurnal & rainfall-induced fluctuation
            rainfall_surge = (simulated_rainfall_mm / 100.0) * random.uniform(1.2, 2.5)
            pore_pressure = base_pore_pressure + (hours - h) * 0.4 + rainfall_surge + random.uniform(-0.5, 0.5)
            vwc = min(98.0, 32.0 + (hours - h) * 0.6 + simulated_rainfall_mm * 0.25)
            tilt_x = 0.02 + (hours - h) * 0.008 + (0.05 if is_warning_station else 0.0)
            tilt_y = 0.01 + (hours - h) * 0.004
            
            incremental_movement = 0.05 + (0.35 if is_warning_station else 0.02) * (pore_pressure / 20.0)
            cumulative_displacement += incremental_movement

            readings.append(
                SensorReadingResponse(
                    id=h,
                    station_id=station_id,
                    timestamp=ts,
                    pore_water_pressure_kpa=round(pore_pressure, 2),
                    soil_moisture_vwc=round(vwc, 1),
                    tilt_angle_x=round(tilt_x, 4),
                    tilt_angle_y=round(tilt_y, 4),
                    surface_displacement_mm=round(cumulative_displacement, 2),
                    temperature_c=round(18.0 + random.uniform(-1.5, 1.5), 1)
                )
            )

        current_reading = readings[-1]
        
        # Geotechnical threshold assessment
        if current_reading.pore_water_pressure_kpa > 38.0:
            pore_status = "CRITICAL"
        elif current_reading.pore_water_pressure_kpa > 25.0:
            pore_status = "ELEVATED"
        else:
            pore_status = "NORMAL"

        displacement_rate = (readings[-1].surface_displacement_mm - readings[0].surface_displacement_mm) / hours

        return SensorTelemetrySummary(
            station_id=station_id,
            station_name=station.name,
            status=station.status,
            current_pore_pressure=current_reading.pore_water_pressure_kpa,
            pore_pressure_status=pore_status,
            current_displacement_mm=current_reading.surface_displacement_mm,
            displacement_rate_mm_hr=round(displacement_rate, 3),
            history=readings
        )

sensor_service = SensorService()
