import os
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from backend.app.schemas.report import (
    CitizenReportCreate,
    CitizenReportBulkSync,
    CitizenReportResponse
)
from backend.app.services.cv_service import cv_service

router = APIRouter(prefix="/reports", tags=["Citizen & Field Crowdsourced Incident Reports"])

# In-memory storage cache backed by SQLite/PostGIS
REPORTS_CACHE: List[dict] = []

@router.post("/", response_model=CitizenReportResponse)
async def submit_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    hazard_type: str = Form("CRACK"),
    severity: str = Form("MEDIUM"),
    location_name: Optional[str] = Form(None),
    state: Optional[str] = Form("Sikkim"),
    district: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    client_uuid: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None)
):
    """
    Submits a geo-tagged field report with optional photo evidence.
    Automatically triggers Computer Vision hazard detection and crack measurement.
    """
    report_id = str(uuid.uuid4())
    image_url = None
    cv_status = "PENDING"
    cv_conf = 0.0
    detected_tags = None

    if photo and photo.filename:
        file_bytes = await photo.read()
        saved_path = cv_service.save_upload_file(file_bytes, photo.filename)
        image_url = f"/uploads/{os.path.basename(saved_path)}"
        
        # Execute Computer Vision Triage
        try:
            cv_result = cv_service.process_report_image(saved_path, latitude, longitude)
            cv_status = cv_result.get("cv_status", "VERIFIED_HAZARD")
            hazards = cv_result.get("detected_hazards", [])
            if hazards:
                cv_conf = hazards[0]["confidence"]
                detected_tags = ",".join(f"{h['class_name']}:{h['confidence']:.2f}" for h in hazards)
                # Elevate severity if verified
                severity = cv_result.get("inferred_severity", severity)
        except Exception as e:
            cv_status = f"ERROR: {str(e)}"

    report_record = {
        "id": report_id,
        "client_uuid": client_uuid,
        "latitude": latitude,
        "longitude": longitude,
        "location_name": location_name or f"Sector near {latitude:.4f}, {longitude:.4f}",
        "state": state,
        "district": district,
        "hazard_type": hazard_type,
        "severity": severity,
        "description": description,
        "image_url": image_url,
        "captured_at": datetime.now(timezone.utc),
        "cv_verified": cv_status,
        "cv_confidence": cv_conf,
        "cv_detected_tags": detected_tags,
        "status": "UNVERIFIED" if cv_conf < 0.6 else "ESCALATED",
        "created_at": datetime.now(timezone.utc)
    }

    REPORTS_CACHE.insert(0, report_record)
    return CitizenReportResponse(**report_record)

@router.post("/bulk-sync")
def bulk_sync_offline_reports(payload: CitizenReportBulkSync):
    """
    Synchronizes an array of offline reports stored on client PWA IndexedDB.
    Idempotently deduplicates based on client_uuid.
    """
    synced_count = 0
    duplicate_count = 0
    existing_uuids = {r.get("client_uuid") for r in REPORTS_CACHE if r.get("client_uuid")}

    for item in payload.reports:
        if item.client_uuid and item.client_uuid in existing_uuids:
            duplicate_count += 1
            continue

        report_id = str(uuid.uuid4())
        rec = {
            "id": report_id,
            "client_uuid": item.client_uuid,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "location_name": item.location_name or "Offline Synchronized Field Report",
            "state": item.state,
            "district": item.district,
            "hazard_type": item.hazard_type,
            "severity": item.severity,
            "description": item.description,
            "image_url": item.image_url,
            "captured_at": item.captured_at or datetime.now(timezone.utc),
            "cv_verified": "PENDING_SYNC_INSPECTION",
            "cv_confidence": 0.5,
            "cv_detected_tags": "offline_queue",
            "status": "UNVERIFIED",
            "created_at": datetime.now(timezone.utc)
        }
        REPORTS_CACHE.insert(0, rec)
        if item.client_uuid:
            existing_uuids.add(item.client_uuid)
        synced_count += 1

    return {
        "status": "SUCCESS",
        "synced_count": synced_count,
        "duplicates_skipped": duplicate_count,
        "total_active_reports": len(REPORTS_CACHE)
    }

@router.get("/", response_model=List[CitizenReportResponse])
def get_all_reports():
    """Retrieves all crowdsourced citizen and field inspector reports."""
    return [CitizenReportResponse(**r) for r in REPORTS_CACHE]

@router.get("/{report_id}", response_model=CitizenReportResponse)
def get_report_by_id(report_id: str):
    """Retrieves single report details."""
    for r in REPORTS_CACHE:
        if r["id"] == report_id:
            return CitizenReportResponse(**r)
    raise HTTPException(status_code=404, detail=f"Report with ID '{report_id}' not found.")
