from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from datetime import datetime
from backend.app.core.database import Base

class SensorStation(Base):
    __tablename__ = "sensor_stations"

    id = Column(String(50), primary_key=True, index=True) # e.g. "SEN-SKM-NH10-01"
    name = Column(String(150), nullable=False)
    zone_code = Column(String(50), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, default=1200.0)
    
    sensor_types = Column(String(150), default="PIEZOMETER,TILTMETER,SOIL_MOISTURE")
    status = Column(String(20), default="ACTIVE") # ACTIVE, WARNING, CRITICAL, OFFLINE
    battery_level_pct = Column(Float, default=95.0)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(String(50), ForeignKey("sensor_stations.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # In-situ Geotechnical Metrics
    pore_water_pressure_kpa = Column(Float, default=12.5) # > 35 kPa indicates critical saturation
    soil_moisture_vwc = Column(Float, default=28.0)       # Volumetric water content %
    tilt_angle_x = Column(Float, default=0.04)            # Angular degrees displacement
    tilt_angle_y = Column(Float, default=0.02)
    surface_displacement_mm = Column(Float, default=1.2)  # Cumulative downslope displacement
    temperature_c = Column(Float, default=18.5)
