from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, Body
from backend.app.services.priority_service import priority_service

router = APIRouter(prefix="/emergency", tags=["Emergency Response Prioritization & Evacuation"])

@router.get("/priorities")
async def get_emergency_priorities():
    """
    Computes real-time Multi-Criteria Decision Analysis (MCDA) emergency urgency scores
    combining Landslide Hazard Probability, Road Criticality, Population Exposure,
    Infrastructure Vulnerability, and Weather Acceleration.
    """
    return await priority_service.calculate_corridor_priorities()

@router.get("/evacuation-routes")
def get_evacuation_routes(
    origin: str = Query("Gangtok", description="Origin city or sector"),
    destination: str = Query("Siliguri", description="Destination city or plains hub")
):
    """
    Calculates primary highway vs alternative mountain bypass routes.
    Automatically activates detour recommendations if the primary lifeline highway (e.g. NH-10)
    is severed or under Tier 1 Critical hazard.
    """
    return priority_service.calculate_safe_detour(origin, destination)

@router.post("/dispatch-order")
def issue_dispatch_order(
    zone_code: str = Body(..., embed=True),
    unit_type: str = Body(..., embed=True, description="NDRF_PLATOON, BRO_EARTHMOVER, TRAFFIC_POLICE, MEDICAL_AMBULANCE"),
    destination_sector: str = Body(..., embed=True),
    authorizing_officer: str = Body("District Magistrate / DDMA Chief", embed=True)
):
    """Issues an official emergency mobilization and resource pre-positioning order."""
    import uuid
    from datetime import datetime, timezone
    
    order_id = f"DISPATCH-{uuid.uuid4().hex[:8].upper()}"
    return {
        "order_id": order_id,
        "zone_code": zone_code,
        "unit_type": unit_type,
        "destination_sector": destination_sector,
        "authorizing_officer": authorizing_officer,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "DISPATCHED",
        "eta_minutes": 45
    }
