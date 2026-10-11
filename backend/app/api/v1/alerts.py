from typing import List, Dict, Any
from fastapi import APIRouter, Body
from backend.app.services.ml_service import ml_service
from backend.app.services.notification_service import notification_service

router = APIRouter(prefix="/alerts", tags=["Early Warning Alerts & Multilingual Notifications"])

# In-memory history of active alerts
ALERTS_HISTORY: List[Dict[str, Any]] = []

@router.get("/active")
async def get_active_alerts():
    """
    Evaluates dynamic landslide risk across all registered pilot zones.
    Generates structured, multilingual early warning notifications for any sector
    meeting WATCH, WARNING, or CRITICAL thresholds.
    """
    zones_pred = await ml_service.predict_for_all_zones()
    active_alerts = []

    for zp in zones_pred:
        score = zp["risk_score_100"]
        if score >= 35.0: # Elevated threshold
            color = zp["color_code"]
            alert_packet = notification_service.generate_multilingual_alert(
                zone_code=zp["zone_code"],
                zone_name=zp["name"],
                corridor_name=zp.get("corridor_name", "Arterial Highway"),
                district="Pilot District",
                state=zp["state"],
                color_code=color,
                risk_score=score,
                top_factors=[{"factor": f} for f in zp.get("top_drivers", [])]
            )
            active_alerts.append(alert_packet)

    return active_alerts

@router.post("/broadcast")
async def broadcast_alert(
    zone_code: str = Body(..., embed=True),
    zone_name: str = Body(..., embed=True),
    corridor_name: str = Body(..., embed=True),
    color_code: str = Body("RED", embed=True),
    risk_score: float = Body(85.0, embed=True),
    district: str = Body("Pakyong / Gangtok", embed=True),
    state: str = Body("Sikkim", embed=True)
):
    """
    Generates and broadcasts a real-time multilingual alert to all connected
    Command Center dashboards, mobile PWA clients, and SMS simulators via WebSockets.
    """
    alert_packet = notification_service.generate_multilingual_alert(
        zone_code=zone_code,
        zone_name=zone_name,
        corridor_name=corridor_name,
        district=district,
        state=state,
        color_code=color_code,
        risk_score=risk_score
    )
    await notification_service.broadcast_alert(alert_packet)
    ALERTS_HISTORY.insert(0, alert_packet)
    return {
        "status": "BROADCAST_SUCCESS",
        "alert": alert_packet,
        "active_listeners": len(notification_service.active_connections)
    }

@router.get("/history")
def get_alert_history():
    """Returns past broadcast alert log."""
    return ALERTS_HISTORY or notification_service.broadcast_history
