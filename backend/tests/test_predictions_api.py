import io
import pytest
from PIL import Image, ImageDraw
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_prediction_point_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "latitude": 27.24,
            "longitude": 88.51,
            "slope_degrees": 38.0,
            "elevation_m": 1280.0,
            "twi": 8.4
        }
        res = await ac.post("/api/v1/predictions/point", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "landslide_probability" in data
        assert "risk_score_100" in data
        assert "shap_top_drivers" in data
        assert len(data["shap_top_drivers"]) > 0
        assert data["risk_tier"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]

@pytest.mark.asyncio
async def test_prediction_all_zones_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/predictions/zones")
        assert res.status_code == 200
        zones = res.json()
        assert len(zones) >= 3
        first_zone = zones[0]
        assert "zone_code" in first_zone
        assert "risk_score_100" in first_zone
        assert "color_code" in first_zone

@pytest.mark.asyncio
async def test_submit_report_and_cv_triage():
    # Create test in-memory image
    img = Image.new("RGB", (300, 300), color=(220, 220, 220))
    draw = ImageDraw.Draw(img)
    draw.line([(20, 20), (280, 280)], fill=(0, 0, 0), width=12) # crack line
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {
            "photo": ("test_slope_crack.jpg", buf, "image/jpeg")
        }
        data = {
            "latitude": 27.24,
            "longitude": 88.51,
            "hazard_type": "CRACK",
            "severity": "HIGH",
            "state": "Sikkim",
            "district": "Pakyong",
            "description": "Widening tension crack observed above road cut."
        }
        res = await ac.post("/api/v1/reports/", data=data, files=files)
        assert res.status_code == 200
        report = res.json()
        assert report["id"] is not None
        assert report["cv_verified"] in ["VERIFIED_HAZARD", "NORMAL", "PENDING"]
        assert report["image_url"] is not None

@pytest.mark.asyncio
async def test_offline_bulk_sync_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        sync_payload = {
            "reports": [
                {
                    "client_uuid": "offline-uuid-test-001",
                    "latitude": 25.66,
                    "longitude": 91.90,
                    "location_name": "NH-6 Umiam Cut Section",
                    "hazard_type": "ROCKFALL",
                    "severity": "MEDIUM",
                    "description": "Small rock fragments tumbling onto shoulder.",
                    "offline_created_timestamp": 1726000000
                },
                {
                    "client_uuid": "offline-uuid-test-002",
                    "latitude": 25.71,
                    "longitude": 94.03,
                    "location_name": "NH-29 Zubza Sinking Zone",
                    "hazard_type": "DEBRIS_FLOW",
                    "severity": "CRITICAL",
                    "description": "Slurry mud flow encroaching on uphill lane.",
                    "offline_created_timestamp": 1726000010
                }
            ]
        }
        res = await ac.post("/api/v1/reports/bulk-sync", json=sync_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUCCESS"
        assert data["synced_count"] >= 2
