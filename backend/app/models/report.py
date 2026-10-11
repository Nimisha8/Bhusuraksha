import uuid
from sqlalchemy import Column, Integer, Float, String, Text, DateTime
from datetime import datetime
from backend.app.core.database import Base

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_uuid = Column(String(64), index=True, nullable=True) # For offline sync deduplication
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(200), nullable=True)
    state = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    
    # Hazard details
    hazard_type = Column(String(50), default="CRACK") # CRACK, ROCKFALL, DEBRIS_FLOW, BLOCKED_ROAD, LEANING_TREE, OTHER
    severity = Column(String(20), default="MEDIUM")   # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=True)
    
    # Evidence & Media
    image_url = Column(String(500), nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    # Computer Vision Verification
    cv_verified = Column(String(20), default="PENDING") # PENDING, VERIFIED_HAZARD, NORMAL, UNCERTAIN
    cv_confidence = Column(Float, default=0.0)
    cv_detected_tags = Column(String(250), nullable=True) # e.g. "ground_crack:0.92,blocked_road:0.87"
    
    # Authority Triage Status
    status = Column(String(20), default="UNVERIFIED") # UNVERIFIED, ESCALATED, DISPATCHED, RESOLVED
    triage_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
