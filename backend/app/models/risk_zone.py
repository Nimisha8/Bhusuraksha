from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from backend.app.core.database import Base

class RiskZone(Base):
    __tablename__ = "risk_zones"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    zone_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    state = Column(String(50), nullable=False)          # Sikkim, Meghalaya, Assam, etc.
    district = Column(String(100), nullable=False)
    corridor_name = Column(String(100), nullable=True)  # e.g., NH-10 Gangtok-Sevoke
    
    # Geographic Centroid
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, default=1000.0)
    
    # Static Physical Terrain Geotechnical Attributes
    slope_degrees = Column(Float, default=32.0)         # High risk if > 35 deg
    aspect = Column(String(20), default="SE")           # Cardinal direction
    soil_type = Column(String(50), default="Phyllite/Schist Colluvium")
    twi = Column(Float, default=7.5)                    # Topographic Wetness Index
    distance_to_road_m = Column(Float, default=25.0)    # Distance to cut slope
    
    # Criticality & Exposure Multipliers (1 - 5)
    road_criticality = Column(Integer, default=5)       # 5 = Lifeline National Highway
    population_exposure = Column(Integer, default=4)    # 1 to 5
    critical_infrastructure_count = Column(Integer, default=2) # Hospitals, bridges, shelters
    
    # Dynamic Hazard State
    baseline_hazard_score = Column(Float, default=35.0) # 0 to 100
    current_hazard_score = Column(Float, default=35.0)  # Dynamic updated score
    risk_tier = Column(String(20), default="MODERATE")  # LOW, MODERATE, HIGH, CRITICAL
    
    # Geometry in GeoJSON format (for lightweight spatial handling)
    geojson_geometry = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
