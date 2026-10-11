import uuid
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, Boolean
from datetime import datetime
from backend.app.core.database import Base

class EarlyWarningAlert(Base):
    __tablename__ = "early_warning_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    zone_code = Column(String(50), index=True, nullable=False)
    corridor_name = Column(String(100), nullable=True)
    district = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    
    # Severity & Scores
    alert_level = Column(String(20), nullable=False) # ADVISORY, WATCH, WARNING, EMERGENCY
    color_code = Column(String(10), default="ORANGE") # YELLOW, ORANGE, RED
    composite_risk_score = Column(Float, nullable=False) # 0 to 100
    
    # Multilingual Messages
    title_en = Column(String(200), nullable=False)
    title_hi = Column(String(200), nullable=True)
    title_regional = Column(String(200), nullable=True)
    message_en = Column(Text, nullable=False)
    message_hi = Column(Text, nullable=True)
    message_regional = Column(Text, nullable=True)
    regional_language = Column(String(20), default="as") # as (Assamese), bn (Bengali), mzo (Mizo)
    
    # Explainable AI Attribution
    top_factors = Column(Text, nullable=True) # JSON list: e.g. [{"factor": "72h Rain", "weight": 0.48}]
    recommended_actions = Column(Text, nullable=True) # JSON or bullet points for NDRF / traffic police
    
    is_active = Column(Boolean, default=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
