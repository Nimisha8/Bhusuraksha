from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from backend.app.schemas.gis import (
    RoadSegmentResponse,
    GeoJSONFeatureCollection
)
from backend.app.services.gis_service import gis_service

router = APIRouter(prefix="/gis", tags=["GIS & Spatial Road Networks"])

@router.get("/roads", response_model=List[RoadSegmentResponse])
def get_roads(status: Optional[str] = Query(None, description="Filter by status: OPEN, RESTRICTED, BLOCKED")):
    """Retrieves arterial road segments in NER along with cut-slope vulnerability metrics."""
    return gis_service.get_road_segments(status)

@router.patch("/roads/{road_id}/status", response_model=RoadSegmentResponse)
def update_road_status(
    road_id: str,
    status: str = Body(..., embed=True, description="New operational status: OPEN, RESTRICTED, BLOCKED")
):
    """Updates the operational status of a highway segment (e.g. if blocked by a landslide)."""
    try:
        updated = gis_service.update_road_status(road_id, status)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Road segment '{road_id}' not found.")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/risk-zones/geojson", response_model=GeoJSONFeatureCollection)
def get_risk_zones_geojson():
    """
    Returns GeoJSON FeatureCollection of all vulnerable slope basins in NER.
    Directly compatible with Leaflet, MapLibre, Deck.gl, and PostGIS vector layers.
    """
    return gis_service.get_risk_polygons_geojson()

@router.get("/locate")
def locate_coordinate(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Spatial lookup: Checks if a coordinate falls inside any active landslide risk polygon
    and identifies the nearest arterial road corridor.
    """
    zone = gis_service.find_zone_for_coordinate(lat, lon)
    nearest_road = gis_service.find_nearest_road_segment(lat, lon)
    return {
        "latitude": lat,
        "longitude": lon,
        "is_inside_risk_zone": zone is not None,
        "risk_zone": zone,
        "nearest_road": nearest_road
    }
