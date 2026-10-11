import os
import json
import joblib
import numpy as np
from typing import Dict, Any, List, Tuple
from ai_ml.pipelines.feature_engineering import (
    extract_feature_vector, 
    FEATURE_NAMES
)

HUMAN_READABLE_NAMES = {
    "slope_degrees": "Steep Slope Gradient",
    "aspect_sin": "Slope Orientation",
    "aspect_cos": "Monsoon Windward Exposure",
    "elevation_m": "High Elevation Zone",
    "twi": "Topographic Wetness / Drainage Convergence",
    "distance_to_road_m": "Unreinforced Road-Cut Proximity",
    "lithology_index": "Fragile Weathered Shale/Phyllite",
    "fault_distance_km": "Proximity to Thrust Fault Line",
    "rain_1h_mm": "Current High-Intensity Rainfall Burst",
    "rain_24h_mm": "Cumulative 24-Hour Rainfall",
    "rain_72h_mm": "Sustained 72-Hour Monsoon Rainfall",
    "api_7_day": "7-Day Antecedent Precipitation Saturation",
    "soil_saturation_pct": "Critical Soil Moisture Saturation",
    "pore_water_pressure_kpa": "Elevated In-Situ Pore-Water Pressure"
}

class LandslidePredictor:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(__file__))
        self.model_path = os.path.join(self.base_dir, "weights", "landslide_hazard_gbdt.joblib")
        self.metadata_path = os.path.join(self.base_dir, "weights", "model_metadata.json")
        self.model = None
        self.metadata = None
        self._load_or_train_model()

    def _load_or_train_model(self):
        if os.path.exists(self.model_path) and os.path.exists(self.metadata_path):
            try:
                self.model = joblib.load(self.model_path)
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                return
            except Exception as e:
                print(f"[AI/ML] Error loading model: {e}. Re-training...")

        # If model does not exist, trigger training
        from ai_ml.pipelines.train_hazard_model import train_and_export_model
        self.model, self.metadata = train_and_export_model()

    def predict(
        self,
        static_terrain: Dict[str, Any],
        dynamic_weather: Dict[str, Any],
        telemetry: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Executes dynamic landslide prediction, computes risk scores (0-100),
        and extracts local SHAP-style feature attributions for early warnings.
        """
        if self.model is None:
            self._load_or_train_model()

        feature_vec = extract_feature_vector(static_terrain, dynamic_weather, telemetry)
        X = feature_vec.reshape(1, -1)

        # Predicted probability of failure
        prob = float(self.model.predict_proba(X)[0, 1])
        score = round(prob * 100.0, 1)

        # Categorize risk tier
        if score >= 80.0:
            tier = "CRITICAL"
            color = "RED"
            alert_triggered = True
            action = "IMMEDIATE EVACUATION & ROAD CLOSURE: Mobilize NDRF and BRO quick-response earthmoving units."
        elif score >= 60.0:
            tier = "HIGH"
            color = "ORANGE"
            alert_triggered = True
            action = "HIGH RISK ADVISORY: Restrict heavy commercial vehicles; deploy highway slope monitoring patrols."
        elif score >= 35.0:
            tier = "MODERATE"
            color = "YELLOW"
            alert_triggered = False
            action = "ELEVATED WATCH: Maintain automated IoT sensor surveillance and track monsoon rainfall forecast."
        else:
            tier = "LOW"
            color = "GREEN"
            alert_triggered = False
            action = "NORMAL SURVEILLANCE: Standard slope stability parameters."

        # Compute Local Feature Attribution (SHAP-Style local contribution)
        # Using feature values relative to baseline median multiplied by global feature importance
        importances = self.metadata.get("global_feature_importances", {})
        shap_factors = []
        positive_contributions = []

        # Reference baseline medians
        baseline_medians = {
            "slope_degrees": 28.0,
            "twi": 7.0,
            "distance_to_road_m": 60.0,
            "lithology_index": 3.0,
            "rain_1h_mm": 2.0,
            "rain_24h_mm": 25.0,
            "rain_72h_mm": 50.0,
            "api_7_day": 30.0,
            "soil_saturation_pct": 45.0,
            "pore_water_pressure_kpa": 18.0
        }

        for idx, feat_name in enumerate(FEATURE_NAMES):
            val = float(feature_vec[idx])
            base = baseline_medians.get(feat_name, 0.0)
            imp = importances.get(feat_name, 0.05)

            # Inverted for distance to road (closer is worse)
            if feat_name == "distance_to_road_m":
                diff = max(0.0, base - val) / (base + 1.0)
            else:
                diff = max(0.0, val - base) / (base + 1.0)

            contribution = diff * imp
            if contribution > 0.005:
                positive_contributions.append((feat_name, contribution, val))

        # Normalize top contributing factors to 100%
        total_contrib = sum(c[1] for c in positive_contributions) or 1.0
        sorted_contribs = sorted(positive_contributions, key=lambda x: x[1], reverse=True)[:4]

        for feat_name, c_score, actual_val in sorted_contribs:
            pct = round((c_score / total_contrib) * 100.0, 1)
            readable = HUMAN_READABLE_NAMES.get(feat_name, feat_name)
            desc = f"{readable} ({actual_val:.1f})" if actual_val > 0 else readable
            shap_factors.append({
                "factor_name": readable,
                "contribution_score": round(c_score, 3),
                "percentage": pct,
                "description": desc
            })

        # Fallback if no individual factor is strongly elevated
        if not shap_factors:
            shap_factors.append({
                "factor_name": "Baseline Geomorphic Vulnerability",
                "contribution_score": 0.5,
                "percentage": 100.0,
                "description": "Fragile geological formation"
            })

        return {
            "landslide_probability": round(prob, 4),
            "risk_score_100": score,
            "risk_tier": tier,
            "color_code": color,
            "rain_1h_mm": float(dynamic_weather.get("rain_1h_mm", 0.0)),
            "rain_24h_mm": float(dynamic_weather.get("rain_24h_mm", 0.0)),
            "api_7_day": float(dynamic_weather.get("api_7_day", 0.0)),
            "soil_saturation_pct": float(dynamic_weather.get("soil_saturation_pct", 50.0)),
            "shap_top_drivers": shap_factors,
            "alert_triggered": alert_triggered,
            "recommended_action": action
        }

landslide_predictor = LandslidePredictor()
