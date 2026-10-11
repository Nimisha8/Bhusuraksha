import pytest
from httpx import AsyncClient, ASGITransport
from starlette.testclient import TestClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_api_emergency_priorities():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/emergency/priorities")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 3
        assert "priority_score" in data[0]
        assert "action_protocol" in data[0]

@pytest.mark.asyncio
async def test_api_evacuation_routes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/emergency/evacuation-routes?origin=Gangtok&destination=Siliguri")
        assert res.status_code == 200
        data = res.json()
        assert "primary_route" in data
        assert "alternative_route" in data
        assert "recommendation_summary" in data

@pytest.mark.asyncio
async def test_api_dispatch_order():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "zone_code": "SKM-NH10-Z1",
            "unit_type": "NDRF_PLATOON",
            "destination_sector": "32nd Mile Singtam",
            "authorizing_officer": "District Magistrate Pakyong"
        }
        res = await ac.post("/api/v1/emergency/dispatch-order", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["order_id"].startswith("DISPATCH-")
        assert data["status"] == "DISPATCHED"

@pytest.mark.asyncio
async def test_api_alerts_active_and_broadcast():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Active alerts
        res_act = await ac.get("/api/v1/alerts/active")
        assert res_act.status_code == 200
        alerts = res_act.json()
        assert isinstance(alerts, list)

        # Broadcast custom alert
        broadcast_payload = {
            "zone_code": "SKM-NH10-Z2",
            "zone_name": "Teesta Bazar Gorge",
            "corridor_name": "NH-10",
            "color_code": "RED",
            "risk_score": 91.0,
            "district": "Kalimpong Border",
            "state": "Sikkim"
        }
        res_bc = await ac.post("/api/v1/alerts/broadcast", json=broadcast_payload)
        assert res_bc.status_code == 200
        data = res_bc.json()
        assert data["status"] == "BROADCAST_SUCCESS"
        assert data["alert"]["color_code"] == "RED"
        assert "en" in data["alert"]["titles"]
        assert "hi" in data["alert"]["titles"]
        assert "as" in data["alert"]["titles"]

def test_websocket_alerts_connection():
    client = TestClient(app)
    with client.websocket_connect("/ws/alerts") as websocket:
        websocket.send_text("PING")
        response = websocket.receive_json()
        assert response["event"] == "HEARTBEAT_ACK"
