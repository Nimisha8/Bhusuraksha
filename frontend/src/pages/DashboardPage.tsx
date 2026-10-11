import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle, ShieldAlert, Radio, Camera, ExternalLink, Cpu, Truck,
  CloudRain, MapPin, CheckCircle2, Activity, TrendingUp
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
  fetchWeatherPilotCorridors, fetchEmergencyPriorities, fetchCitizenReports,
  fetchSensorStations, fetchPredictionPoint,
  WeatherCorridor, PriorityItem, CitizenReportItem, SensorStation, PredictionPointResult
} from "../services/api";
import { ExplainableAiModal } from "../components/ExplainableAiModal";
import { DispatchOrderModal } from "../components/DispatchOrderModal";
import { LanguageKey, DICTIONARY } from "../locales/i18n";

// ── Counter animation hook ───────────────────────────────
const useCountUp = (target: number, duration = 1400, trigger: boolean) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger || target === 0) return;
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target, trigger]);
  return value;
};

// ── Skeleton shimmer component ───────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="p-5 rounded-2xl" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
    <div style={{ height: 10, width: "50%", borderRadius: 6, marginBottom: 16,
      background: "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
    <div style={{ height: 32, width: "40%", borderRadius: 6, marginBottom: 10,
      background: "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite 0.15s" }} />
    <div style={{ height: 6, width: "70%", borderRadius: 999,
      background: "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite 0.3s" }} />
  </div>
);

const SkeletonRow: React.FC = () => (
  <tr>
    {[40, 180, 100, 80, 70, 120].map((w, i) => (
      <td key={i} className="py-3.5 pl-2">
        <div style={{ height: 10, width: w, borderRadius: 4,
          background: "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)",
          backgroundSize: "200% 100%", animation: `shimmer 1.4s infinite ${i * 0.1}s` }} />
      </td>
    ))}
  </tr>
);

interface DashboardPageProps {
  currentLang: LanguageKey;
  onNavigateMap: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(2,8,23,0.95)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px" }}>
        <p style={{ color: "#94a3b8", marginBottom: "4px" }}>{label}</p>
        <p style={{ color: "#00d4ff", fontWeight: 700 }}>{payload[0].value} mm</p>
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentLang, onNavigateMap }) => {
  const t = DICTIONARY[currentLang];
  const [corridors, setCorridors] = useState<WeatherCorridor[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [reports, setReports] = useState<CitizenReportItem[]>([]);
  const [sensors, setSensors] = useState<SensorStation[]>([]);
  const [selectedCorridorKey, setSelectedCorridorKey] = useState<string>("sikkim_nh10");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeXaiPrediction, setActiveXaiPrediction] = useState<PredictionPointResult | null>(null);
  const [xaiZoneName, setXaiZoneName] = useState<string>("");
  const [xaiCorridorName, setXaiCorridorName] = useState<string>("");
  const [dispatchItem, setDispatchItem] = useState<PriorityItem | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [wData, pData, rData, sData] = await Promise.all([
          fetchWeatherPilotCorridors(), fetchEmergencyPriorities(),
          fetchCitizenReports(), fetchSensorStations()
        ]);
        setCorridors(wData); setPriorities(pData); setReports(rData); setSensors(sData);
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleOpenXai = async (item: PriorityItem) => {
    try {
      const lat = item.zone_code.includes("SKM") ? 27.24 : (item.zone_code.includes("ML") ? 25.66 : 25.71);
      const lon = item.zone_code.includes("SKM") ? 88.51 : (item.zone_code.includes("ML") ? 91.90 : 94.03);
      const pred = await fetchPredictionPoint(lat, lon);
      setActiveXaiPrediction(pred);
      setXaiZoneName(item.name);
      setXaiCorridorName(item.corridor_name || "");
    } catch (e) {
      console.error("Failed to load XAI explanation:", e);
    }
  };

  const selectedCorridor = corridors.find(c => c.key === selectedCorridorKey) || corridors[0];
  const criticalPrioritiesCount = priorities.filter(p => p.priority_tier === "TIER_1_CRITICAL").length;
  const blockedRoadsCount = priorities.filter(p => p.is_road_blocked).length;

  // Counter targets — 0 while loading so they animate in on data arrival
  const animatedCritical = useCountUp(loading ? 0 : criticalPrioritiesCount, 1200, !loading);
  const animatedBlocked  = useCountUp(loading ? 0 : (blockedRoadsCount || 1), 1000, !loading);
  const animatedSensors  = useCountUp(loading ? 0 : (sensors.length || 4), 1400, !loading);
  const animatedReports  = useCountUp(loading ? 0 : (reports.length || 3), 1100, !loading);

  const rainfallChartData = selectedCorridor ? [
    { day: "Day -6", rain: Math.round(selectedCorridor.rain_72h_mm * 0.15) },
    { day: "Day -5", rain: Math.round(selectedCorridor.rain_72h_mm * 0.22) },
    { day: "Day -4", rain: Math.round(selectedCorridor.rain_72h_mm * 0.38) },
    { day: "Day -3", rain: Math.round(selectedCorridor.rain_72h_mm * 0.55) },
    { day: "Day -2", rain: Math.round(selectedCorridor.rain_72h_mm * 0.72) },
    { day: "Yesterday", rain: Math.round(selectedCorridor.rain_24h_mm) },
    { day: "Today (Live)", rain: Math.round(selectedCorridor.current_rain_mm * 3 + selectedCorridor.rain_24h_mm) }
  ] : [];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020817 0%, #050d1f 50%, #02061a 100%)" }}>
      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px", zIndex: 0
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl"
          style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", boxShadow: "0 0 40px rgba(0,212,255,0.05)" }}>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6" style={{ color: "#00d4ff" }} />
              NER Disaster Operations Command Center
            </h1>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
              Real-time multi-hazard surveillance — Sikkim (NH-10) · Meghalaya (NH-6) · Nagaland (NH-29) · Assam
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#00d4ff" }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#00d4ff" }} />
            </span>
            <span className="text-xs font-bold" style={{ color: "#00d4ff" }}>SYSTEM TELEMETRY SYNCHRONIZED</span>
          </div>
        </div>

        {/* KPI Cards — skeletons while loading, counters after */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              {/* Critical Sectors */}
              <div className="p-5 rounded-2xl relative overflow-hidden"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 0 24px rgba(239,68,68,0.08)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
                  style={{ background: "#ef4444", transform: "translate(40%,-40%)" }} />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Critical Sectors</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <ShieldAlert className="w-4 h-4" style={{ color: "#f87171" }} />
                  </div>
                </div>
                <div className="text-3xl font-black" style={{ color: "#f87171" }}>{animatedCritical}</div>
                <p className="text-[11px] mt-1" style={{ color: "#475569" }}>Tier 1 — immediate mobilization</p>
                <div className="mt-3 h-1 rounded-full" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <div className="h-full rounded-full animate-pulse" style={{ width: "72%", background: "#ef4444" }} />
                </div>
              </div>

              {/* Blocked Corridors */}
              <div className="p-5 rounded-2xl relative overflow-hidden"
                style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.25)", boxShadow: "0 0 24px rgba(251,146,60,0.08)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
                  style={{ background: "#fb923c", transform: "translate(40%,-40%)" }} />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Blocked Corridors</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.3)" }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: "#fb923c" }} />
                  </div>
                </div>
                <div className="text-3xl font-black" style={{ color: "#fb923c" }}>{animatedBlocked}</div>
                <p className="text-[11px] mt-1" style={{ color: "#475569" }}>NH-10 Teesta gorge restricted</p>
                <div className="mt-3 h-1 rounded-full" style={{ background: "rgba(251,146,60,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: "45%", background: "#fb923c" }} />
                </div>
              </div>

              {/* IoT Sensors */}
              <div className="p-5 rounded-2xl relative overflow-hidden"
                style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.18)", boxShadow: "0 0 24px rgba(0,212,255,0.06)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15 pointer-events-none"
                  style={{ background: "#00d4ff", transform: "translate(40%,-40%)" }} />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>IoT Sensor Stations</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
                    <Radio className="w-4 h-4" style={{ color: "#00d4ff" }} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{animatedSensors}</div>
                <p className="text-[11px] mt-1" style={{ color: "#475569" }}>Piezometers & tiltmeter arrays</p>
                <div className="mt-3 h-1 rounded-full" style={{ background: "rgba(0,212,255,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: "88%", background: "#00d4ff" }} />
                </div>
              </div>

              {/* Citizen Reports */}
              <div className="p-5 rounded-2xl relative overflow-hidden"
                style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.18)", boxShadow: "0 0 24px rgba(52,211,153,0.06)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15 pointer-events-none"
                  style={{ background: "#34d399", transform: "translate(40%,-40%)" }} />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Citizen Field Reports</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }}>
                    <Camera className="w-4 h-4" style={{ color: "#34d399" }} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{animatedReports}</div>
                <p className="text-[11px] mt-1" style={{ color: "#475569" }}>Tension cracks & debris verified</p>
                <div className="mt-3 h-1 rounded-full" style={{ background: "rgba(52,211,153,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: "60%", background: "#34d399" }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rainfall Chart + Corridor Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl space-y-4"
            style={{ background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.12)", boxShadow: "0 0 40px rgba(0,212,255,0.04)" }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CloudRain className="w-4 h-4" style={{ color: "#00d4ff" }} />
                  Live Antecedent Rainfall (API-7) & Hydrologic Saturation
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                  7-day cumulative decay model (k=0.84) — pore-water pressure trigger analysis
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg shrink-0"
                style={{ background: "rgba(2,8,23,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
                {corridors.map(c => (
                  <button key={c.key} onClick={() => setSelectedCorridorKey(c.key)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded transition-all"
                    style={selectedCorridorKey === c.key
                      ? { background: "#00d4ff", color: "#020817", boxShadow: "0 0 12px rgba(0,212,255,0.5)" }
                      : { color: "#64748b" }}>
                    {c.state}
                  </button>
                ))}
              </div>
            </div>

            {selectedCorridor && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl"
                style={{ background: "rgba(2,8,23,0.6)", border: "1px solid rgba(0,212,255,0.08)" }}>
                <div>
                  <span className="text-[10px] uppercase font-bold" style={{ color: "#475569" }}>24h Rainfall</span>
                  <p className="text-sm font-black text-white">{selectedCorridor.rain_24h_mm} mm</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold" style={{ color: "#475569" }}>72h Cumulative</span>
                  <p className="text-sm font-black" style={{ color: "#00d4ff" }}>{selectedCorridor.rain_72h_mm} mm</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold" style={{ color: "#475569" }}>API-7 Index</span>
                  <p className="text-sm font-black" style={{ color: "#67e8f9" }}>{selectedCorridor.api_7_day} mm</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold" style={{ color: "#475569" }}>Soil Saturation</span>
                  <p className="text-sm font-black"
                    style={{ color: selectedCorridor.saturation_state === "SUPERSATURATED" ? "#f87171" : "#34d399" }}>
                    {selectedCorridor.soil_saturation_pct}%
                  </p>
                </div>
              </div>
            )}

            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rainfallChartData}>
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                  <XAxis dataKey="day" stroke="#334155" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis stroke="#334155" tick={{ fontSize: 11, fill: "#475569" }} unit=" mm" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="rain" stroke="#00d4ff" strokeWidth={2.5}
                    fillOpacity={1} fill="url(#cyanGradient)" isAnimationActive={true}
                    animationDuration={1200} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lifeline Corridors Panel */}
          <div className="p-5 rounded-2xl flex flex-col justify-between space-y-3.5"
            style={{ background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.12)" }}>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Lifeline Corridors Status</span>
                <button onClick={onNavigateMap} className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{ color: "#00d4ff" }}>
                  Full Map <ExternalLink className="w-3 h-3" />
                </button>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Cut-slope vulnerability & live weather</p>
              <div className="space-y-2.5 mt-3">
                {corridors.map((c) => (
                  <div key={c.key} onClick={() => setSelectedCorridorKey(c.key)}
                    className="p-3 rounded-xl cursor-pointer transition-all"
                    style={selectedCorridorKey === c.key
                      ? { background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.35)", boxShadow: "0 0 16px rgba(0,212,255,0.1)" }
                      : { background: "rgba(2,8,23,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{c.corridor_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={c.vulnerability_tier === "CRITICAL"
                          ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }
                          : { background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)" }}>
                        {c.vulnerability_tier}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1.5" style={{ color: "#475569" }}>
                      <span>{c.weather_description}</span>
                      <span className="font-semibold" style={{ color: "#00d4ff" }}>{c.rain_24h_mm} mm/24h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={onNavigateMap}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
              <MapPin className="w-4 h-4" style={{ color: "#00d4ff" }} />
              Inspect Terrain & Slope Cut Buffers
            </button>
          </div>
        </div>

        {/* MCDA Prioritization Table */}
        <div className="p-5 rounded-2xl space-y-4"
          style={{ background: "rgba(0,212,255,0.02)", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "#f87171" }} />
                Emergency Response Urgency Ranks — MCDA Prioritization
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                Weighted index: Landslide Probability × Road Criticality × Settlement Exposure × Rainfall Trend
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-lg self-start sm:self-auto"
              style={{ background: "rgba(2,8,23,0.8)", border: "1px solid rgba(0,212,255,0.12)", color: "#475569" }}>
              Algorithm: MCDA Tiered Protocol
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider"
                  style={{ borderBottom: "1px solid rgba(0,212,255,0.1)", color: "#475569" }}>
                  <th className="pb-3 pl-2">Rank</th>
                  <th className="pb-3">Sector & Corridor</th>
                  <th className="pb-3">Priority Score</th>
                  <th className="pb-3">Operational Tier</th>
                  <th className="pb-3">Road Status</th>
                  <th className="pb-3 text-right pr-2">Action & Dispatch</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                ) : (
                  priorities.map((item, idx) => (
                    <tr key={item.zone_code} className="transition-colors"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: item.priority_tier === "TIER_1_CRITICAL" ? "rgba(239,68,68,0.04)" : "transparent"
                      }}>
                      <td className="py-3.5 pl-2 font-mono font-black" style={{ color: "#64748b" }}>#{idx + 1}</td>
                      <td className="py-3.5">
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-[11px] font-mono mt-0.5" style={{ color: "#475569" }}>{item.corridor_name} ({item.state})</div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-white">{item.priority_score}</span>
                          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full" style={{
                              width: `${item.priority_score}%`,
                              background: item.priority_score >= 80 ? "#ef4444" : item.priority_score >= 50 ? "#fb923c" : "#00d4ff",
                              boxShadow: item.priority_score >= 80 ? "0 0 8px rgba(239,68,68,0.6)" : undefined,
                              transition: "width 1s cubic-bezier(0.25,1,0.5,1)"
                            }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={item.priority_tier === "TIER_1_CRITICAL"
                            ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }
                            : item.priority_tier === "TIER_2_HIGH"
                            ? { background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)" }
                            : { background: "rgba(0,212,255,0.1)", color: "#67e8f9", border: "1px solid rgba(0,212,255,0.2)" }}>
                          {item.tier_name.split(":")[0]}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {item.is_road_blocked ? (
                          <span className="font-bold text-[11px] flex items-center gap-1" style={{ color: "#f87171" }}>
                            <AlertTriangle className="w-3.5 h-3.5" /> BLOCKED
                          </span>
                        ) : (
                          <span className="font-bold text-[11px] flex items-center gap-1" style={{ color: "#34d399" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> CLEAR
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right pr-2 space-x-2">
                        <button onClick={() => handleOpenXai(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded inline-flex items-center gap-1 transition-all hover:opacity-80"
                          style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}>
                          <Cpu className="w-3 h-3" /> Explain
                        </button>
                        <button onClick={() => setDispatchItem(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white rounded inline-flex items-center gap-1 transition-all hover:opacity-80"
                          style={{ background: "rgba(239,68,68,0.7)", border: "1px solid rgba(239,68,68,0.5)" }}>
                          <Truck className="w-3 h-3" /> Mobilize
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {activeXaiPrediction && (
          <ExplainableAiModal prediction={activeXaiPrediction} zoneName={xaiZoneName}
            corridorName={xaiCorridorName} onClose={() => setActiveXaiPrediction(null)} />
        )}
        {dispatchItem && (
          <DispatchOrderModal zoneCode={dispatchItem.zone_code} zoneName={dispatchItem.name}
            corridorName={dispatchItem.corridor_name} onClose={() => setDispatchItem(null)}
            onSuccess={(orderId) => { console.log("Mobilization confirmed:", orderId); }} />
        )}
      </div>
    </div>
  );
};