import json
import os
from typing import List, Dict, Any, Optional
from shapely.geometry import Point, shape
from backend.app.schemas.gis import (
    RoadSegmentResponse,
    GeoJSONFeatureCollection,
    GeoJSONFeature
)

class GisService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.roads_file = os.path.join(self.base_dir, "gis_pipeline", "data", "ner_pilot_corridors.json")
        self.polygons_file = os.path.join(self.base_dir, "gis_pipeline", "data", "ner_risk_polygons.json")
        
        self.roads_data: List[Dict[str, Any]] = self._load_roads()
        self.polygons_data: Dict[str, Any] = self._load_polygons()

    def _load_roads(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.roads_file):
            with open(self.roads_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def _load_polygons(self) -> Dict[str, Any]:
        if os.path.exists(self.polygons_file):
            with open(self.polygons_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"type": "FeatureCollection", "features": []}

    def get_road_segments(self, status: Optional[str] = None) -> List[RoadSegmentResponse]:
        """Returns road segments, optionally filtered by status (OPEN, RESTRICTED, BLOCKED)."""
        results = []
        for r in self.roads_data:
            if status and r.get("status") != status.upper():
                continue
            results.append(RoadSegmentResponse(**r))
        return results

    def get_risk_polygons_geojson(self) -> GeoJSONFeatureCollection:
        """Returns the GeoJSON FeatureCollection of all vulnerable slope zones."""
        features = []
        for feat in self.polygons_data.get("features", []):
            features.append(
                GeoJSONFeature(
                    type="Feature",
                    geometry=feat.get("geometry", {}),
                    properties=feat.get("properties", {})
                )
            )
        return GeoJSONFeatureCollection(type="FeatureCollection", features=features)

    def find_zone_for_coordinate(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """Finds if a given lat/lon falls within any defined risk zone polygon."""
        pt = Point(longitude, latitude)
        for feat in self.polygons_data.get("features", []):
            poly_geom = shape(feat.get("geometry"))
            if poly_geom.contains(pt):
                return feat.get("properties")
        return None

    def find_nearest_road_segment(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """Finds the nearest road corridor segment to the coordinate."""
        if not self.roads_data:
            return None
        pt = Point(longitude, latitude)
        best_road = None
        min_dist = float("inf")
        
        for r in self.roads_data:
            # Approximate distance to line midpoint
            mid_lon = (r["start_lon"] + r["end_lon"]) / 2.0
            mid_lat = (r["start_lat"] + r["end_lat"]) / 2.0
            dist = pt.distance(Point(mid_lon, mid_lat))
            if dist < min_dist:
                min_dist = dist
                best_road = r
        return best_road

    def update_road_status(self, road_id: str, new_status: str) -> Optional[RoadSegmentResponse]:
        """Updates the operational status of a highway segment."""
        valid_statuses = {"OPEN", "RESTRICTED", "BLOCKED"}
        status_upper = new_status.upper()
        if status_upper not in valid_statuses:
            raise ValueError(f"Invalid status '{new_status}'. Must be one of {valid_statuses}")

        for r in self.roads_data:
            if r.get("id") == road_id:
                r["status"] = status_upper
                return RoadSegmentResponse(**r)
        return None

gis_service = GisService()
