import logging
from typing import Dict, Any, List, Optional
from ai_ml.inference.predict_hazard import landslide_predictor
from backend.app.services.weather_service import weather_service
from backend.app.services.gis_service import gis_service
from backend.app.services.sensor_service import sensor_service
from backend.app.schemas.prediction import PredictionResponse, ShapFactor

logger = logging.getLogger(__name__)

class MachineLearningService:
    def __init__(self):
        self.predictor = landslide_predictor

    async def predict_for_coordinate(
        self,
        latitude: float,
        longitude: float,
        slope_degrees: Optional[float] = None,
        elevation_m: Optional[float] = None,
        twi: Optional[float] = None,
        distance_to_road_m: Optional[float] = None
    ) -> PredictionResponse:
        """
        Gathers live dynamic weather + static terrain properties for a coordinate,
        runs the trained ML model, and returns calibrated risk metrics and SHAP factors.
        """
        # 1. Fetch live weather & 7-day antecedent rainfall indices
        weather = await weather_service.fetch_weather_and_antecedent(
            latitude, longitude, "NER Hazard Query"
        )
        ai = weather.antecedent_indices

        dynamic_weather = {
            "rain_1h_mm": ai.rain_1h_mm,
            "rain_24h_mm": ai.rain_24h_mm,
            "rain_72h_mm": ai.rain_72h_mm,
            "api_7_day": ai.api_7_day,
            "soil_saturation_pct": ai.soil_moisture_pct or 50.0
        }

        # 2. Extract or lookup static terrain attributes
        zone_props = gis_service.find_zone_for_coordinate(latitude, longitude)
        nearest_road = gis_service.find_nearest_road_segment(latitude, longitude)

        static_terrain = {
            "slope_degrees": slope_degrees if slope_degrees is not None else (zone_props.get("slope_degrees", 34.0) if zone_props else 30.0),
            "aspect": zone_props.get("aspect", "SE") if zone_props else "SE",
            "elevation_m": elevation_m if elevation_m is not None else (zone_props.get("elevation_m", 1200.0) if zone_props else 1200.0),
            "twi": twi if twi is not None else (zone_props.get("twi", 7.8) if zone_props else 7.2),
            "distance_to_road_m": distance_to_road_m if distance_to_road_m is not None else (15.0 if nearest_road else 60.0),
            "lithology_index": 4.0, # Fragile phyllite/shale formation standard across NER
            "fault_distance_km": 4.0
        }

        # 3. Check for nearby IoT sensor telemetry
        telemetry = None
        for st in sensor_service.list_stations():
            # If within ~10km of a known geotechnical sensor station
            dist = abs(st.latitude - latitude) + abs(st.longitude - longitude)
            if dist < 0.1:
                tel_summary = sensor_service.generate_station_telemetry(st.id, hours=1, simulated_rainfall_mm=ai.rain_24h_mm)
                telemetry = {
                    "pore_water_pressure_kpa": tel_summary.current_pore_pressure
                }
                break

        # 4. Run ML inference & SHAP explainability
        pred = self.predictor.predict(static_terrain, dynamic_weather, telemetry)

        shap_drivers = [
            ShapFactor(
                factor_name=sf["factor_name"],
                contribution_score=sf["contribution_score"],
                percentage=sf["percentage"],
                description=sf["description"]
            )
            for sf in pred["shap_top_drivers"]
        ]

        return PredictionResponse(
            latitude=latitude,
            longitude=longitude,
            landslide_probability=pred["landslide_probability"],
            risk_score_100=pred["risk_score_100"],
            risk_tier=pred["risk_tier"],
            color_code=pred["color_code"],
            rain_1h_mm=pred["rain_1h_mm"],
            rain_24h_mm=pred["rain_24h_mm"],
            api_7_day=pred["api_7_day"],
            soil_saturation_pct=pred["soil_saturation_pct"],
            shap_top_drivers=shap_drivers,
            alert_triggered=pred["alert_triggered"],
            recommended_action=pred["recommended_action"]
        )

    async def predict_for_all_zones(self) -> List[Dict[str, Any]]:
        """Computes dynamic risk scores across all defined NER pilot risk zones."""
        fc = gis_service.get_risk_polygons_geojson()
        results = []

        for feat in fc.features:
            props = feat.properties
            coords = feat.geometry["coordinates"][0]
            # Polygon center
            avg_lon = sum(c[0] for c in coords) / len(coords)
            avg_lat = sum(c[1] for c in coords) / len(coords)

            pred_res = await self.predict_for_coordinate(
                latitude=avg_lat,
                longitude=avg_lon,
                slope_degrees=props.get("slope_degrees"),
                twi=props.get("twi")
            )

            results.append({
                "zone_code": props.get("zone_code"),
                "name": props.get("name"),
                "state": props.get("state"),
                "corridor_name": props.get("corridor_name"),
                "latitude": avg_lat,
                "longitude": avg_lon,
                "risk_score_100": pred_res.risk_score_100,
                "risk_tier": pred_res.risk_tier,
                "color_code": pred_res.color_code,
                "alert_triggered": pred_res.alert_triggered,
                "top_drivers": [d.factor_name for d in pred_res.shap_top_drivers[:2]],
                "recommended_action": pred_res.recommended_action
            })

        return results

ml_service = MachineLearningService()
