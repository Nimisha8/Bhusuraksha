from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class AlertCreate(BaseModel):
    zone_code: str
    corridor_name: Optional[str] = None
    district: str
    state: str
    alert_level: str = Field("WARNING", description="ADVISORY, WATCH, WARNING, EMERGENCY")
    color_code: str = Field("ORANGE", description="YELLOW, ORANGE, RED")
    composite_risk_score: float = Field(..., ge=0.0, le=100.0)
    title_en: str
    message_en: str
    title_hi: Optional[str] = None
    message_hi: Optional[str] = None
    title_regional: Optional[str] = None
    message_regional: Optional[str] = None
    regional_language: Optional[str] = "as"
    top_factors: Optional[str] = None
    recommended_actions: Optional[str] = None

class AlertResponse(AlertCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool
    issued_at: datetime
    expires_at: Optional[datetime] = None

class AlertBroadcastRequest(BaseModel):
    alert_id: str
    channels: list[str] = ["WEBSOCKET", "SMS", "WEBPUSH"]
