import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_root_and_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res_root = await ac.get("/")
        assert res_root.status_code == 200
        if "application/json" in res_root.headers.get("content-type", ""):
            assert res_root.json()["status"] == "OPERATIONAL"
        else:
            assert "GeoSurge" in res_root.text or "html" in res_root.text.lower()

        res_health = await ac.get("/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_api_pilot_corridors_weather():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/weather/pilot-corridors")
        assert res.status_code == 200
        corridors = res.json()
        assert len(corridors) >= 4
        keys = [c["key"] for c in corridors]
        assert "sikkim_nh10" in keys
        assert "meghalaya_nh6" in keys

@pytest.mark.asyncio
async def test_api_sensor_stations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/sensors/stations")
        assert res.status_code == 200
        stations = res.json()
        assert len(stations) >= 3

        # Test telemetry query
        st_id = stations[0]["id"]
        res_tel = await ac.get(f"/api/v1/sensors/stations/{st_id}/telemetry?hours=12")
        assert res_tel.status_code == 200
        data = res_tel.json()
        assert data["station_id"] == st_id
        assert len(data["history"]) == 12

@pytest.mark.asyncio
async def test_api_gis_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res_roads = await ac.get("/api/v1/gis/roads")
        assert res_roads.status_code == 200
        roads = res_roads.json()
        assert len(roads) >= 4

        res_geojson = await ac.get("/api/v1/gis/risk-zones/geojson")
        assert res_geojson.status_code == 200
        fc = res_geojson.json()
        assert fc["type"] == "FeatureCollection"
        assert len(fc["features"]) >= 3

        # Locate endpoint
        res_loc = await ac.get("/api/v1/gis/locate?lat=27.24&lon=88.51")
        assert res_loc.status_code == 200
        loc_data = res_loc.json()
        assert loc_data["is_inside_risk_zone"] is True
        assert loc_data["risk_zone"]["zone_code"] == "SKM-NH10-Z1"
