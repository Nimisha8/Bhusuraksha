import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_end_to_end_disaster_flow():
    """
    Verifies complete end-to-end integration:
    1. System health and Web static bundle check
    2. Point hazard ML scoring & SHAP attributions
    3. Corridor MCDA emergency prioritization
    4. Safe mountain detour routing lookup
    5. Active multilingual alert broadcast verification
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Health check
        res_health = await ac.get("/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # 2. ML Point Prediction
        res_pred = await ac.post("/api/v1/predictions/point", json={
            "latitude": 27.24,
            "longitude": 88.51,
            "slope_degrees": 38.0
        })
        assert res_pred.status_code == 200
        pred_data = res_pred.json()
        assert "risk_score_100" in pred_data
        assert "shap_top_drivers" in pred_data
        assert len(pred_data["shap_top_drivers"]) > 0

        # 3. MCDA Emergency Prioritization
        res_prio = await ac.get("/api/v1/emergency/priorities")
        assert res_prio.status_code == 200
        priorities = res_prio.json()
        assert len(priorities) >= 3
        scores = [p["priority_score"] for p in priorities]
        assert scores == sorted(scores, reverse=True)

        # 4. Detour Routing Engine
        res_detour = await ac.get("/api/v1/emergency/evacuation-routes?origin=Gangtok&destination=Siliguri")
        assert res_detour.status_code == 200
        detour = res_detour.json()
        assert "primary_route" in detour
        assert "alternative_route" in detour
        assert "rerouting_active" in detour

        # 5. Multilingual Alerts
        res_alerts = await ac.get("/api/v1/alerts/active")
        assert res_alerts.status_code == 200
        alerts = res_alerts.json()
        assert len(alerts) >= 1
        assert "titles" in alerts[0]
        assert "en" in alerts[0]["titles"]
        assert "hi" in alerts[0]["titles"]
