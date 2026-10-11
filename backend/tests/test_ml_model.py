import pytest
import numpy as np
from ai_ml.pipelines.feature_engineering import extract_feature_vector, FEATURE_NAMES
from ai_ml.inference.predict_hazard import landslide_predictor

def test_feature_vector_dimension():
    static = {
        "slope_degrees": 38.0,
        "aspect": "SE",
        "elevation_m": 1500.0,
        "twi": 8.5,
        "distance_to_road_m": 20.0,
        "lithology_index": 4.0,
        "fault_distance_km": 3.0
    }
    dynamic = {
        "rain_1h_mm": 12.0,
        "rain_24h_mm": 65.0,
        "rain_72h_mm": 140.0,
        "api_7_day": 85.0,
        "soil_saturation_pct": 82.0
    }
    vec = extract_feature_vector(static, dynamic)
    assert len(vec) == len(FEATURE_NAMES)
    assert vec[0] == 38.0 # slope_degrees

def test_extreme_storm_prediction():
    # Extreme monsoon conditions on fragile slope
    static_critical = {
        "slope_degrees": 44.0,
        "aspect": "SE",
        "elevation_m": 1400.0,
        "twi": 9.2,
        "distance_to_road_m": 12.0,
        "lithology_index": 5.0,
        "fault_distance_km": 1.5
    }
    dynamic_critical = {
        "rain_1h_mm": 28.0,
        "rain_24h_mm": 145.0,
        "rain_72h_mm": 260.0,
        "api_7_day": 125.0,
        "soil_saturation_pct": 94.0
    }
    telemetry_critical = {
        "pore_water_pressure_kpa": 42.5
    }
    
    res = landslide_predictor.predict(static_critical, dynamic_critical, telemetry_critical)
    
    assert res["landslide_probability"] > 0.65
    assert res["risk_score_100"] >= 65.0
    assert res["risk_tier"] in ["HIGH", "CRITICAL"]
    assert res["color_code"] in ["ORANGE", "RED"]
    assert res["alert_triggered"] is True
    assert len(res["shap_top_drivers"]) > 0

def test_dry_stable_slope_prediction():
    # Stable conditions
    static_safe = {
        "slope_degrees": 16.0,
        "aspect": "N",
        "elevation_m": 600.0,
        "twi": 5.0,
        "distance_to_road_m": 150.0,
        "lithology_index": 2.0,
        "fault_distance_km": 15.0
    }
    dynamic_safe = {
        "rain_1h_mm": 0.0,
        "rain_24h_mm": 0.0,
        "rain_72h_mm": 2.0,
        "api_7_day": 1.5,
        "soil_saturation_pct": 25.0
    }
    
    res = landslide_predictor.predict(static_safe, dynamic_safe)
    
    assert res["landslide_probability"] < 0.40
    assert res["risk_tier"] in ["LOW", "MODERATE"]
    assert res["alert_triggered"] is False
