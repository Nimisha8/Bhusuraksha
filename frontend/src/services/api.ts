export interface WeatherCorridor {
  key: string;
  corridor_name: string;
  state: string;
  vulnerability_tier: string;
  latitude: number;
  longitude: number;
  current_temp_c: number;
  current_rain_mm: number;
  rain_24h_mm: number;
  rain_72h_mm: number;
  api_7_day: number;
  soil_saturation_pct: number;
  saturation_state: string;
  weather_description: string;
}

export interface SensorStation {
  id: string;
  name: string;
  zone_code: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  sensor_types: string;
  status: string;
  battery_level_pct: number;
  last_heartbeat: string;
}

export interface SensorTelemetry {
  station_id: string;
  station_name: string;
  status: string;
  current_pore_pressure: number;
  pore_pressure_status: string;
  current_displacement_mm: number;
  displacement_rate_mm_hr: number;
  history: Array<{
    id: number;
    timestamp: string;
    pore_water_pressure_kpa: number;
    soil_moisture_vwc: number;
    tilt_angle_x: number;
    tilt_angle_y: number;
    surface_displacement_mm: number;
    temperature_c: number;
  }>;
}

export interface RoadSegment {
  id: string;
  road_code: string;
  name: string;
  state: string;
  section_name: string;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  length_km: number;
  status: "OPEN" | "RESTRICTED" | "BLOCKED";
  cut_slope_hazard: string;
  criticality_tier: number;
  bypass_available: boolean;
}

export interface PriorityItem {
  zone_code: string;
  name: string;
  state: string;
  corridor_name?: string;
  priority_score: number;
  priority_tier: string;
  tier_name: string;
  color_code: string;
  hazard_probability: number;
  road_criticality: number;
  is_road_blocked: boolean;
  population_exposure: number;
  weather_acceleration: number;
  action_protocol: string[];
  resource_package: {
    heavy_machinery: string;
    personnel: string;
    evacuation_status: string;
  };
}

export interface ShapFactor {
  factor_name: string;
  contribution_score: number;
  percentage: number;
  description: string;
}

export interface PredictionPointResult {
  latitude: number;
  longitude: number;
  landslide_probability: number;
  risk_score_100: number;
  risk_tier: string;
  color_code: string;
  rain_1h_mm: number;
  rain_24h_mm: number;
  api_7_day: number;
  soil_saturation_pct: number;
  shap_top_drivers: ShapFactor[];
  alert_triggered: boolean;
  recommended_action: string;
}

export interface EarlyWarningAlert {
  alert_id: string;
  zone_code: string;
  zone_name: string;
  corridor_name: string;
  district: string;
  state: string;
  color_code: string;
  risk_score: number;
  timestamp: string;
  titles: Record<string, string>;
  messages: Record<string, string>;
  top_factors?: Array<{ factor: string }>;
}

export interface CitizenReportItem {
  id: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  state?: string;
  district?: string;
  hazard_type: string;
  severity: string;
  description?: string;
  image_url?: string;
  captured_at: string;
  cv_verified: string;
  cv_confidence: number;
  cv_detected_tags?: string;
  status: string;
}

// API Methods
export async function fetchWeatherPilotCorridors(): Promise<WeatherCorridor[]> {
  const res = await fetch("/api/v1/weather/pilot-corridors");
  if (!res.ok) throw new Error("Failed to fetch pilot weather corridors");
  return res.json();
}

export async function fetchSensorStations(): Promise<SensorStation[]> {
  const res = await fetch("/api/v1/sensors/stations");
  if (!res.ok) throw new Error("Failed to fetch sensor stations");
  return res.json();
}

export async function fetchSensorTelemetry(stationId: string, hours = 24): Promise<SensorTelemetry> {
  const res = await fetch(`/api/v1/sensors/stations/${stationId}/telemetry?hours=${hours}`);
  if (!res.ok) throw new Error("Failed to fetch sensor telemetry");
  return res.json();
}

export async function fetchGisRoads(): Promise<RoadSegment[]> {
  const res = await fetch("/api/v1/gis/roads");
  if (!res.ok) throw new Error("Failed to fetch GIS roads");
  return res.json();
}

export async function updateRoadStatus(roadId: string, status: string): Promise<RoadSegment> {
  const res = await fetch(`/api/v1/gis/roads/${roadId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error("Failed to update road status");
  return res.json();
}

export async function fetchGisRiskPolygons(): Promise<any> {
  const res = await fetch("/api/v1/gis/risk-zones/geojson");
  if (!res.ok) throw new Error("Failed to fetch risk polygons");
  return res.json();
}

export async function fetchPredictionPoint(lat: number, lon: number): Promise<PredictionPointResult> {
  const res = await fetch("/api/v1/predictions/point", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude: lat, longitude: lon })
  });
  if (!res.ok) throw new Error("Failed to predict hazard score");
  return res.json();
}

export async function fetchPredictionZones(): Promise<any[]> {
  const res = await fetch("/api/v1/predictions/zones");
  if (!res.ok) throw new Error("Failed to fetch zone predictions");
  return res.json();
}

export async function fetchEmergencyPriorities(): Promise<PriorityItem[]> {
  const res = await fetch("/api/v1/emergency/priorities");
  if (!res.ok) throw new Error("Failed to fetch emergency priorities");
  return res.json();
}

export async function fetchEvacuationRoutes(origin = "Gangtok", destination = "Siliguri"): Promise<any> {
  const res = await fetch(`/api/v1/emergency/evacuation-routes?origin=${origin}&destination=${destination}`);
  if (!res.ok) throw new Error("Failed to fetch evacuation routes");
  return res.json();
}

export async function issueDispatchOrder(payload: {
  zone_code: string;
  unit_type: string;
  destination_sector: string;
}): Promise<any> {
  const res = await fetch("/api/v1/emergency/dispatch-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to issue dispatch order");
  return res.json();
}

export async function fetchActiveAlerts(): Promise<EarlyWarningAlert[]> {
  const res = await fetch("/api/v1/alerts/active");
  if (!res.ok) throw new Error("Failed to fetch active alerts");
  return res.json();
}

export async function broadcastAlert(payload: any): Promise<any> {
  const res = await fetch("/api/v1/alerts/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to broadcast alert");
  return res.json();
}

export async function submitCitizenReport(formData: FormData): Promise<CitizenReportItem> {
  const res = await fetch("/api/v1/reports/", {
    method: "POST",
    body: formData
  });
  if (!res.ok) throw new Error("Failed to submit citizen report");
  return res.json();
}

export async function fetchCitizenReports(): Promise<CitizenReportItem[]> {
  const res = await fetch("/api/v1/reports/");
  if (!res.ok) throw new Error("Failed to fetch citizen reports");
  return res.json();
}
