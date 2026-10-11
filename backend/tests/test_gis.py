import pytest
from backend.app.services.gis_service import gis_service

def test_load_roads():
    roads = gis_service.get_road_segments()
    assert len(roads) >= 4
    nh10_roads = [r for r in roads if r.road_code == "NH-10"]
    assert len(nh10_roads) >= 2

def test_risk_polygons_geojson():
    fc = gis_service.get_risk_polygons_geojson()
    assert fc.type == "FeatureCollection"
    assert len(fc.features) >= 3
    feature_props = [f.properties["zone_code"] for f in fc.features]
    assert "SKM-NH10-Z1" in feature_props

def test_spatial_containment_and_locate():
    # 32nd Mile / Singtam coordinate in Sikkim
    lat = 27.24
    lon = 88.51
    zone = gis_service.find_zone_for_coordinate(lat, lon)
    assert zone is not None
    assert zone["zone_code"] == "SKM-NH10-Z1"

    nearest_road = gis_service.find_nearest_road_segment(lat, lon)
    assert nearest_road is not None
    assert nearest_road["road_code"] == "NH-10"

def test_update_road_status():
    road_id = "ROAD-SKM-NH10-S1"
    updated = gis_service.update_road_status(road_id, "BLOCKED")
    assert updated.status == "BLOCKED"
    
    # Restore to RESTRICTED
    restored = gis_service.update_road_status(road_id, "RESTRICTED")
    assert restored.status == "RESTRICTED"
