import math
from typing import Dict, Any, List, Tuple
import numpy as np

# Feature Column Names in canonical order
FEATURE_NAMES = [
    "slope_degrees",
    "aspect_sin",
    "aspect_cos",
    "elevation_m",
    "twi",
    "distance_to_road_m",
    "lithology_index",
    "fault_distance_km",
    "rain_1h_mm",
    "rain_24h_mm",
    "rain_72h_mm",
    "api_7_day",
    "soil_saturation_pct",
    "pore_water_pressure_kpa"
]

ASPECT_DEGREES_MAP = {
    "N": 0.0,
    "NE": 45.0,
    "E": 90.0,
    "SE": 135.0,
    "S": 180.0,
    "SW": 225.0,
    "W": 270.0,
    "NW": 315.0
}

def encode_aspect(aspect: Any) -> Tuple[float, float]:
    """Encodes cardinal or degree aspect into continuous sine & cosine components."""
    if isinstance(aspect, str):
        deg = ASPECT_DEGREES_MAP.get(aspect.upper().strip(), 135.0)
    else:
        deg = float(aspect)
    rad = math.radians(deg)
    return round(math.sin(rad), 4), round(math.cos(rad), 4)

def extract_feature_vector(
    static_terrain: Dict[str, Any],
    dynamic_weather: Dict[str, Any],
    telemetry: Dict[str, Any] = None
) -> np.ndarray:
    """
    Transforms static terrain attributes, dynamic weather indicators, and sensor telemetry
    into a standardized 1D feature vector for model inference.
    """
    aspect_val = static_terrain.get("aspect", "SE")
    aspect_sin, aspect_cos = encode_aspect(aspect_val)
    
    slope = float(static_terrain.get("slope_degrees", 32.0))
    elevation = float(static_terrain.get("elevation_m", 1200.0))
    twi = float(static_terrain.get("twi", 7.5))
    dist_road = float(static_terrain.get("distance_to_road_m", 25.0))
    lithology = float(static_terrain.get("lithology_index", 4.0)) # 1-5 scale (4 = fragile phyllite/shale)
    fault_dist = float(static_terrain.get("fault_distance_km", 4.5))

    rain_1h = float(dynamic_weather.get("rain_1h_mm", 0.0))
    rain_24h = float(dynamic_weather.get("rain_24h_mm", 0.0))
    rain_72h = float(dynamic_weather.get("rain_72h_mm", 0.0))
    api_7 = float(dynamic_weather.get("api_7_day", 0.0))
    soil_sat = float(dynamic_weather.get("soil_saturation_pct", 50.0))

    if telemetry:
        pore_pressure = float(telemetry.get("pore_water_pressure_kpa", 15.0))
    else:
        # Physical estimation: pore-water pressure increases with API-7 and 24h rainfall
        pore_pressure = min(60.0, 10.0 + (api_7 * 0.18) + (rain_24h * 0.12))

    features = [
        slope,
        aspect_sin,
        aspect_cos,
        elevation,
        twi,
        dist_road,
        lithology,
        fault_dist,
        rain_1h,
        rain_24h,
        rain_72h,
        api_7,
        soil_sat,
        pore_pressure
    ]

    return np.array(features, dtype=np.float32)

def generate_synthetic_training_data(n_samples: int = 1500) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates realistic geotechnically grounded synthetic training samples for the NER region
    incorporating empirical failure physics (infinite slope Mohr-Coulomb failure criteria).
    """
    np.random.seed(42)
    X = np.zeros((n_samples, len(FEATURE_NAMES)), dtype=np.float32)
    y = np.zeros(n_samples, dtype=np.int32)

    for i in range(n_samples):
        # Sample realistic NER terrain distributions
        slope = np.random.uniform(12.0, 52.0)
        aspect_deg = np.random.uniform(0.0, 360.0)
        aspect_sin = np.sin(np.radians(aspect_deg))
        aspect_cos = np.cos(np.radians(aspect_deg))
        elevation = np.random.uniform(300.0, 2600.0)
        twi = np.random.uniform(4.5, 11.5)
        dist_road = np.random.exponential(40.0) + 5.0 # Most cuts near roads
        lithology = np.random.choice([2.0, 3.0, 4.0, 5.0], p=[0.1, 0.25, 0.45, 0.2])
        fault_dist = np.random.exponential(8.0) + 0.5

        # Sample weather distributions (monsoon vs non-monsoon)
        is_monsoon = np.random.rand() < 0.65
        if is_monsoon:
            rain_1h = np.random.exponential(8.0)
            rain_24h = np.random.uniform(15.0, 180.0)
            rain_72h = rain_24h + np.random.uniform(20.0, 240.0)
            api_7 = (rain_72h * 0.4) + np.random.uniform(10.0, 60.0)
            soil_sat = min(100.0, 40.0 + (api_7 * 0.45))
        else:
            rain_1h = np.random.exponential(1.0)
            rain_24h = np.random.uniform(0.0, 20.0)
            rain_72h = np.random.uniform(0.0, 40.0)
            api_7 = np.random.uniform(0.0, 25.0)
            soil_sat = np.random.uniform(20.0, 45.0)

        pore_pressure = 8.0 + (soil_sat * 0.25) + (rain_24h * 0.1)

        X[i] = [
            slope, aspect_sin, aspect_cos, elevation, twi, dist_road,
            lithology, fault_dist, rain_1h, rain_24h, rain_72h, api_7,
            soil_sat, pore_pressure
        ]

        # Simplified Factor of Safety (FoS) physics approximation:
        # FoS = (c + (gamma * z * cos^2(theta) - u) * tan(phi)) / (gamma * z * sin(theta) * cos(theta))
        # Failure occurs if FoS < 1.0 (or failure score exceeds critical threshold)
        shear_stress = math.sin(math.radians(slope)) * 1.5
        shear_strength = (
            math.cos(math.radians(slope)) * 1.2
            - (pore_pressure / 50.0)
            - (twi / 25.0)
            - (1.0 if dist_road < 30.0 else 0.0) * 0.3
            - (lithology / 15.0)
        )
        
        water_trigger = (rain_72h > 120.0 or api_7 > 80.0 or pore_pressure > 35.0)
        is_failure = (shear_stress > shear_strength) and (water_trigger or slope > 40.0)
        
        # Add slight stochastic noise to mimic real field unpredictability
        if np.random.rand() < 0.05:
            is_failure = not is_failure
            
        y[i] = 1 if is_failure else 0

    return X, y
