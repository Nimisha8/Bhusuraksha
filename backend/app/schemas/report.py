from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class CitizenReportCreate(BaseModel):
    client_uuid: Optional[str] = Field(None, description="Client-side UUID for idempotent offline sync")
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    hazard_type: str = Field("CRACK", description="CRACK, ROCKFALL, DEBRIS_FLOW, BLOCKED_ROAD, LEANING_TREE, OTHER")
    severity: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    description: Optional[str] = None
    image_url: Optional[str] = None
    captured_at: Optional[datetime] = None

class CitizenReportBulkSyncItem(CitizenReportCreate):
    offline_created_timestamp: int

class CitizenReportBulkSync(BaseModel):
    reports: list[CitizenReportBulkSyncItem]

class CitizenReportResponse(CitizenReportCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    cv_verified: str
    cv_confidence: float
    cv_detected_tags: Optional[str] = None
    status: str
    created_at: datetime
