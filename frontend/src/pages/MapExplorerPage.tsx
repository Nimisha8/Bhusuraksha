import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import {
  fetchGisRoads, fetchGisRiskPolygons, fetchSensorStations,
  fetchCitizenReports, fetchPredictionPoint, updateRoadStatus,
  RoadSegment, SensorStation, CitizenReportItem, PredictionPointResult
} from "../services/api";
import { Layers, Compass, Cpu, X, RefreshCw, Radio, Battery, Wifi, Activity } from "lucide-react";

// Risk tier config — single source of truth
const RISK = {
  CRITICAL: { color: "#ef4444", fill: "rgba(239,68,68,0.45)", border: "#fca5a5", label: "Critical Risk",   weight: 3 },
  HIGH:     { color: "#f97316", fill: "rgba(249,115,22,0.38)", border: "#fdba74", label: "High Risk",      weight: 2.5 },
  MODERATE: { color: "#eab308", fill: "rgba(234,179,8,0.30)",  border: "#fde047", label: "Moderate Risk",  weight: 2 },
  LOW:      { color: "#22c55e", fill: "rgba(34,197,94,0.22)",  border: "#86efac", label: "Low / Safe",     weight: 1.5 },
};

const getRisk = (tier: string) => RISK[tier as keyof typeof RISK] ?? RISK.LOW;

const batteryColor = (pct: number) => pct > 60 ? "#4ade80" : pct > 30 ? "#fbbf24" : "#f87171";

export const MapExplorerPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [sensors, setSensors] = useState<SensorStation[]>([]);
  const [reports, setReports] = useState<CitizenReportItem[]>([]);
  const [polygonsGeoJson, setPolygonsGeoJson] = useState<any>(null);

  const [showPolygons, setShowPolygons] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showReports, setShowReports] = useState(true);

  const [selectedSensor, setSelectedSensor] = useState<SensorStation | null>(null);
  const [clickedPrediction, setClickedPrediction] = useState<PredictionPointResult | null>(null);
  const [evaluatingPoint, setEvaluatingPoint] = useState(false);

  const layersRef = useRef<{
    polygons?: L.GeoJSON;
    roads?: L.LayerGroup;
    sensors?: L.LayerGroup;
    reports?: L.LayerGroup;
    clickMarker?: L.Marker;
  }>({});

  useEffect(() => {
    async function loadGisData() {
      try {
        const [rData, sData, repData, polyData] = await Promise.all([
          fetchGisRoads(), fetchSensorStations(), fetchCitizenReports(), fetchGisRiskPolygons()
        ]);
        setRoads(rData); setSensors(sData); setReports(repData); setPolygonsGeoJson(polyData);
      } catch (err) { console.error("Failed to load GIS data:", err); }
    }
    loadGisData();
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [26.4, 91.2], zoom: 8, zoomControl: false });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (layersRef.current.clickMarker) map.removeLayer(layersRef.current.clickMarker);
      const clickIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 0 10px #f59e0b;"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8]
      });
      layersRef.current.clickMarker = L.marker([lat, lng], { icon: clickIcon }).addTo(map);
      setEvaluatingPoint(true); setClickedPrediction(null);
      try {
        const res = await fetchPredictionPoint(lat, lng);
        setClickedPrediction(res);
      } catch (err) { console.error("Point prediction error:", err); }
      finally { setEvaluatingPoint(false); }
    });

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Render layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Risk polygons — thicker borders, more opaque fill, rich popup
    if (layersRef.current.polygons) map.removeLayer(layersRef.current.polygons);
    if (showPolygons && polygonsGeoJson) {
      layersRef.current.polygons = L.geoJSON(polygonsGeoJson, {
        style: (feature) => {
          const r = getRisk(feature?.properties?.risk_tier);
          return { color: r.color, weight: r.weight, opacity: 1, fillColor: r.color, fillOpacity: 0.42 };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          const r = getRisk(p.risk_tier);
          layer.bindPopup(`
            <div style="font-family:system-ui;font-size:12px;min-width:220px;background:#0f172a;color:#e2e8f0;border-radius:10px;overflow:hidden;">
              <div style="background:${r.color}22;border-bottom:2px solid ${r.color};padding:10px 14px;">
                <div style="font-weight:800;font-size:13px;color:${r.color};">⚠ ${p.risk_tier} RISK ZONE</div>
                <div style="font-weight:700;color:#f1f5f9;margin-top:2px;">${p.name}</div>
                <div style="color:#64748b;font-size:10px;margin-top:2px;">${p.zone_code} · ${p.corridor_name || "NE Corridor"}</div>
              </div>
              <div style="padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
                <div style="background:#1e293b;border-radius:6px;padding:7px 9px;">
                  <div style="color:#64748b;font-size:10px;margin-bottom:2px;">Hazard Score</div>
                  <div style="font-weight:800;font-size:18px;color:${r.color};">${p.current_hazard_score}</div>
                </div>
                <div style="background:#1e293b;border-radius:6px;padding:7px 9px;">
                  <div style="color:#64748b;font-size:10px;margin-bottom:2px;">Slope</div>
                  <div style="font-weight:700;font-size:15px;color:#f1f5f9;">${p.slope_degrees}°</div>
                </div>
                <div style="background:#1e293b;border-radius:6px;padding:7px 9px;">
                  <div style="color:#64748b;font-size:10px;margin-bottom:2px;">TWI Index</div>
                  <div style="font-weight:700;font-size:15px;color:#f1f5f9;">${p.twi}</div>
                </div>
                <div style="background:#1e293b;border-radius:6px;padding:7px 9px;">
                  <div style="color:#64748b;font-size:10px;margin-bottom:2px;">Geology</div>
                  <div style="font-weight:600;font-size:11px;color:#94a3b8;">${p.geology_type || "—"}</div>
                </div>
              </div>
            </div>
          `, { maxWidth: 260 });
          // Highlight on hover
          layer.on("mouseover", () => (layer as L.Path).setStyle({ fillOpacity: 0.65, weight: (getRisk(p.risk_tier).weight) + 1.5 }));
          layer.on("mouseout",  () => (layer as L.Path).setStyle({ fillOpacity: 0.42, weight: getRisk(p.risk_tier).weight }));
        }
      }).addTo(map);
    }

    // 2. Roads — thicker, clearer status colors
    if (layersRef.current.roads) map.removeLayer(layersRef.current.roads);
    if (showRoads && roads.length > 0) {
      const roadGroup = L.layerGroup();
      roads.forEach(r => {
        const color = r.status === "BLOCKED" ? "#ef4444" : r.status === "RESTRICTED" ? "#f97316" : "#22c55e";
        const line = L.polyline([[r.start_lat, r.start_lon], [r.end_lat, r.end_lon]], {
          color, weight: 6, opacity: 0.95,
          dashArray: r.status === "BLOCKED" ? "1,8" : r.status === "RESTRICTED" ? "10,6" : undefined
        });
        line.bindPopup(`
          <div style="font-family:system-ui;font-size:12px;min-width:200px;background:#0f172a;color:#e2e8f0;padding:12px 14px;border-radius:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <strong style="font-size:13px;color:#f1f5f9;">${r.name}</strong>
              <span style="padding:2px 10px;border-radius:20px;font-size:10px;font-weight:800;background:${color}22;color:${color};border:1px solid ${color}55;">${r.status}</span>
            </div>
            <div style="color:#64748b;font-size:10px;margin-bottom:8px;">${r.road_code} · ${r.length_km} km</div>
            <div style="background:#1e293b;border-radius:6px;padding:7px 10px;font-size:11px;color:#94a3b8;">
              Cut-Slope Hazard: <strong style="color:#fbbf24;">${r.cut_slope_hazard}</strong>
            </div>
            <div style="margin-top:10px;">
              <button onclick="window.__toggleRoad('${r.id}','${r.status === "BLOCKED" ? "OPEN" : "BLOCKED"}')"
                style="padding:5px 12px;background:#1e293b;border:1px solid #334155;color:#fbbf24;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;width:100%;">
                Set ${r.status === "BLOCKED" ? "✓ OPEN" : "✗ BLOCKED"}
              </button>
            </div>
          </div>
        `, { maxWidth: 240 });
        roadGroup.addLayer(line);
      });
      roadGroup.addTo(map);
      layersRef.current.roads = roadGroup;
    }

    // 3. Sensors — pulsing ring animation, larger icon
    if (layersRef.current.sensors) map.removeLayer(layersRef.current.sensors);
    if (showSensors && sensors.length > 0) {
      const sensorGroup = L.layerGroup();
      sensors.forEach(s => {
        const isActive = s.status === "ACTIVE";
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
              ${isActive ? `<div style="position:absolute;width:36px;height:36px;border-radius:50%;border:2px solid #60a5fa;animation:sensorPulse 2s ease-out infinite;opacity:0;"></div>` : ""}
              <div style="width:28px;height:28px;border-radius:50%;background:${isActive ? "#1d4ed8" : "#374151"};border:2.5px solid ${isActive ? "#93c5fd" : "#6b7280"};box-shadow:0 0 12px ${isActive ? "rgba(59,130,246,0.7)" : "rgba(0,0,0,0.3)"};display:flex;align-items:center;justify-content:center;z-index:1;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isActive ? "#bfdbfe" : "#9ca3af"}" stroke-width="2.5" stroke-linecap="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="${isActive ? "#bfdbfe" : "#9ca3af"}"/>
                </svg>
              </div>
            </div>`,
          iconSize: [36, 36], iconAnchor: [18, 18]
        });
        const marker = L.marker([s.latitude, s.longitude], { icon });
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedSensor(s);
          setClickedPrediction(null);
          setEvaluatingPoint(false);
        });
        sensorGroup.addLayer(marker);
      });
      sensorGroup.addTo(map);
      layersRef.current.sensors = sensorGroup;
    }

    // 4. Citizen reports — larger, more visible
    if (layersRef.current.reports) map.removeLayer(layersRef.current.reports);
    if (showReports && reports.length > 0) {
      const reportGroup = L.layerGroup();
      reports.forEach(rep => {
        const sevColor = rep.severity === "HIGH" || rep.severity === "CRITICAL" ? "#ef4444" : "#f59e0b";
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:34px;height:34px;border-radius:50%;border:2px solid ${sevColor};animation:sensorPulse 2.5s ease-out infinite 0.5s;opacity:0;"></div>
              <div style="width:28px;height:28px;border-radius:50%;background:${sevColor === "#ef4444" ? "#7f1d1d" : "#78350f"};border:2.5px solid ${sevColor};box-shadow:0 0 10px ${sevColor}80;display:flex;align-items:center;justify-content:center;z-index:1;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fef3c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>`,
          iconSize: [34, 34], iconAnchor: [17, 17]
        });
        const marker = L.marker([rep.latitude, rep.longitude], { icon });
        marker.bindPopup(`
          <div style="font-family:system-ui;font-size:12px;max-width:220px;background:#0f172a;color:#e2e8f0;padding:12px 14px;border-radius:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <strong style="color:#fbbf24;font-size:13px;">⚠ ${rep.hazard_type}</strong>
              <span style="font-size:10px;background:${sevColor}22;color:${sevColor};border:1px solid ${sevColor}55;padding:2px 8px;border-radius:20px;font-weight:700;">${rep.severity}</span>
            </div>
            <p style="font-size:11px;color:#94a3b8;margin:0 0 6px;">${rep.description || "Ground observation report"}</p>
            ${rep.cv_detected_tags ? `<div style="font-size:10px;color:#4ade80;font-family:monospace;background:#052e16;padding:4px 8px;border-radius:5px;">AI Tags: ${rep.cv_detected_tags}</div>` : ""}
          </div>
        `, { maxWidth: 240 });
        reportGroup.addLayer(marker);
      });
      reportGroup.addTo(map);
      layersRef.current.reports = reportGroup;
    }
  }, [showPolygons, showRoads, showSensors, showReports, polygonsGeoJson, roads, sensors, reports]);

  useEffect(() => {
    (window as any).__toggleRoad = async (roadId: string, newStatus: string) => {
      try {
        await updateRoadStatus(roadId, newStatus);
        const updated = await fetchGisRoads();
        setRoads(updated);
      } catch (err) { console.error("Failed to update road status:", err); }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 4rem)", background: "#020817", overflow: "hidden" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* ── LAYER CONTROLS (top-left) ── */}
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 1000,
        background: "rgba(5,13,31,0.94)", backdropFilter: "blur(14px)",
        border: "1px solid rgba(51,65,85,0.9)", borderRadius: 14,
        padding: "14px 16px", minWidth: 210, boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.1em", marginBottom: 12 }}>
          MAP LAYERS
        </div>
        {[
          { key: "polygons", val: showPolygons, set: setShowPolygons, color: "#ef4444", label: "Risk Zones" },
          { key: "roads",    val: showRoads,    set: setShowRoads,    color: "#22c55e", label: "Road Network", isDash: true },
          { key: "sensors",  val: showSensors,  set: setShowSensors,  color: "#3b82f6", label: "IoT Sensors" },
          { key: "reports",  val: showReports,  set: setShowReports,  color: "#f59e0b", label: "Field Reports" },
        ].map(item => (
          <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: item.val ? "#e2e8f0" : "#475569", cursor: "pointer", marginBottom: 10, transition: "color 0.2s" }}>
            <input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)} style={{ accentColor: item.color, width: 14, height: 14 }} />
            {item.isDash
              ? <span style={{ width: 18, height: 3, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              : <span style={{ width: 12, height: 12, borderRadius: "50%", background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
            }
            {item.label}
          </label>
        ))}
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10, marginTop: 2, fontSize: 10, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
          <Compass size={10} color="#f59e0b" />
          Click anywhere to predict risk
        </div>
      </div>

      {/* ── RISK LEGEND (bottom-left) ── */}
      <div style={{
        position: "absolute", bottom: 32, left: 16, zIndex: 1000,
        background: "rgba(5,13,31,0.94)", backdropFilter: "blur(14px)",
        border: "1px solid rgba(51,65,85,0.9)", borderRadius: 14,
        padding: "14px 16px", minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.1em", marginBottom: 10 }}>
          LANDSLIDE RISK LEVEL
        </div>
        {Object.entries(RISK).map(([tier, r]) => (
          <div key={tier} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 16, borderRadius: 4,
              background: r.fill, border: `2px solid ${r.color}`,
              flexShrink: 0
            }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{tier}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{r.label}</div>
            </div>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.1em", marginBottom: 8 }}>ROAD STATUS</div>
          {[
            { color: "#22c55e", label: "Open / Passable" },
            { color: "#f97316", label: "Restricted", dash: true },
            { color: "#ef4444", label: "Blocked / Closed", dot: true },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <svg width="28" height="6">
                {item.dot
                  ? <line x1="0" y1="3" x2="28" y2="3" stroke={item.color} strokeWidth="4" strokeDasharray="1,6" strokeLinecap="round"/>
                  : item.dash
                  ? <line x1="0" y1="3" x2="28" y2="3" stroke={item.color} strokeWidth="3" strokeDasharray="8,5"/>
                  : <line x1="0" y1="3" x2="28" y2="3" stroke={item.color} strokeWidth="4"/>
                }
              </svg>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.1em", marginBottom: 8 }}>MARKERS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#1d4ed8", border: "2px solid #93c5fd", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>IoT Sensor (click for data)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#78350f", border: "2px solid #f59e0b", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Citizen Report</span>
          </div>
        </div>
      </div>

      {/* ── SENSOR SIDE PANEL ── */}
      {selectedSensor && (
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 1001,
          width: 320, background: "rgba(5,13,31,0.97)", backdropFilter: "blur(16px)",
          borderLeft: "1px solid rgba(59,130,246,0.25)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #1e293b", background: "rgba(29,78,216,0.08)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1d4ed8", border: "2px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(59,130,246,0.4)" }}>
                  <Radio size={16} color="#bfdbfe" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{selectedSensor.name}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, fontFamily: "monospace" }}>{selectedSensor.id}</div>
                </div>
              </div>
              <button onClick={() => setSelectedSensor(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                background: selectedSensor.status === "ACTIVE" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                color: selectedSensor.status === "ACTIVE" ? "#4ade80" : "#f87171",
                border: `1px solid ${selectedSensor.status === "ACTIVE" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`
              }}>{selectedSensor.status}</span>
              <span style={{ fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                <Wifi size={10} />{selectedSensor.zone_code}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", marginBottom: 8 }}>POWER STATUS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Battery size={16} color={batteryColor(selectedSensor.battery_level_pct)} />
                <div style={{ flex: 1, height: 6, background: "#1e293b", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, width: `${selectedSensor.battery_level_pct}%`, background: batteryColor(selectedSensor.battery_level_pct), transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: batteryColor(selectedSensor.battery_level_pct) }}>{selectedSensor.battery_level_pct}%</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", marginBottom: 8 }}>SENSOR TYPES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(selectedSensor.sensor_types || "").split(",").map((t: string) => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(59,130,246,0.1)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}>
                    {t.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", marginBottom: 8 }}>LOCATION</div>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Lat: <span style={{ color: "#f1f5f9", fontWeight: 600, fontFamily: "monospace" }}>{selectedSensor.latitude.toFixed(4)}</span></div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Lon: <span style={{ color: "#f1f5f9", fontWeight: 600, fontFamily: "monospace" }}>{selectedSensor.longitude.toFixed(4)}</span></div>
              </div>
            </div>

            {(selectedSensor as any).readings && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", marginBottom: 8 }}>LIVE READINGS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.entries((selectedSensor as any).readings).map(([k, v]) => (
                    <div key={k} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selectedSensor as any).last_reading_at && (
              <div style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={11} />
                Last sync: {new Date((selectedSensor as any).last_reading_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── POINT PREDICTION DRAWER ── */}
      {(evaluatingPoint || clickedPrediction) && !selectedSensor && (
        <div style={{
          position: "absolute", bottom: 24, right: 24, zIndex: 1000,
          width: 340, background: "rgba(5,13,31,0.97)", backdropFilter: "blur(12px)",
          border: "1px solid #1e293b", borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", padding: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
              <Cpu size={14} color="#f59e0b" />
              Point Slope Risk Assessment
            </div>
            <button onClick={() => { setClickedPrediction(null); setEvaluatingPoint(false); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
              <X size={15} />
            </button>
          </div>

          {evaluatingPoint ? (
            <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <RefreshCw size={20} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />
              Querying live weather & GBDT model…
            </div>
          ) : clickedPrediction && (
            <div style={{ fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2 }}>COORDINATES</div>
                  <div style={{ fontFamily: "monospace", color: "#e2e8f0", fontSize: 11 }}>{clickedPrediction.latitude.toFixed(4)}, {clickedPrediction.longitude.toFixed(4)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2 }}>RISK SCORE</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: getRisk(clickedPrediction.risk_tier).color, lineHeight: 1 }}>
                    {clickedPrediction.risk_score_100}<span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>/100</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 11 }}>
                <div style={{ color: "#94a3b8" }}>24h Rain: <strong style={{ color: "#fbbf24" }}>{clickedPrediction.rain_24h_mm} mm</strong></div>
                <div style={{ color: "#94a3b8" }}>API-7: <strong style={{ color: "#fbbf24" }}>{clickedPrediction.api_7_day} mm</strong></div>
                <div style={{ color: "#94a3b8" }}>Saturation: <strong style={{ color: "#f1f5f9" }}>{clickedPrediction.soil_saturation_pct}%</strong></div>
                <div style={{ color: "#94a3b8" }}>Tier: <strong style={{ color: getRisk(clickedPrediction.risk_tier).color }}>{clickedPrediction.risk_tier}</strong></div>
              </div>
              {clickedPrediction.shap_top_drivers.length > 0 && (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>TOP RISK TRIGGER</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>
                    <span>{clickedPrediction.shap_top_drivers[0].factor_name}</span>
                    <span style={{ color: "#fbbf24" }}>{clickedPrediction.shap_top_drivers[0].percentage}%</span>
                  </div>
                </div>
              )}
              <p style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", margin: 0 }}>{clickedPrediction.recommended_action}</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes sensorPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          border: 1px solid #1e293b !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { background: #0f172a !important; }
        .leaflet-popup-close-button { color: #64748b !important; font-size: 18px !important; top: 8px !important; right: 10px !important; }
      `}</style>
    </div>
  );
};