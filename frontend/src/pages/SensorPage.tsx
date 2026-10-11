import React, { useState, useEffect } from "react";
import { 
  Radio, 
  Battery, 
  Activity, 
  Gauge, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { 
  fetchSensorStations, 
  fetchSensorTelemetry, 
  SensorStation, 
  SensorTelemetry 
} from "../services/api";

export const SensorPage: React.FC = () => {
  const [stations, setStations] = useState<SensorStation[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("SEN-SKM-NH10-01");
  const [telemetry, setTelemetry] = useState<SensorTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStations() {
      try {
        const data = await fetchSensorStations();
        setStations(data);
        if (data.length > 0) {
          setSelectedStationId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch sensor stations:", err);
      }
    }
    loadStations();
  }, []);

  useEffect(() => {
    async function loadTelemetry() {
      if (!selectedStationId) return;
      setLoading(true);
      try {
        const tel = await fetchSensorTelemetry(selectedStationId, 24);
        setTelemetry(tel);
      } catch (err) {
        console.error("Failed to load telemetry:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTelemetry();
  }, [selectedStationId]);

  const selectedStation = stations.find(s => s.id === selectedStationId);

  // Format chart data
  const chartData = telemetry?.history.map((h, idx) => ({
    time: `-${24 - idx}h`,
    porePressure: h.pore_water_pressure_kpa,
    displacement: h.surface_displacement_mm,
    vwc: h.soil_moisture_vwc
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-blue-400" />
            In-Situ Geotechnical IoT Telemetry Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time borehole vibrating-wire piezometers, soil volumetric water content (VWC), and surface inclinometer arrays.
          </p>
        </div>

        {/* Station Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-300">Station:</label>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-500"
          >
            {stations.map(st => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sensor Metadata & Live Gauges */}
      {selectedStation && telemetry && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Pore Pressure Card */}
          <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Pore Pressure (u)</span>
              <Gauge className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-100">{telemetry.current_pore_pressure}</span>
              <span className="text-xs text-slate-400">kPa</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold ${
                telemetry.pore_pressure_status === "CRITICAL" ? "text-red-400" : (telemetry.pore_pressure_status === "ELEVATED" ? "text-amber-400" : "text-emerald-400")
              }`}>
                {telemetry.pore_pressure_status} (Threshold: 35 kPa)
              </span>
            </div>
          </div>

          {/* Cumulative Displacement Card */}
          <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Displacement</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-400">{telemetry.current_displacement_mm}</span>
              <span className="text-xs text-slate-400">mm</span>
            </div>
            <div className="text-xs text-slate-400">
              Velocity Rate: <span className="text-slate-200 font-bold">{telemetry.displacement_rate_mm_hr} mm/hr</span>
            </div>
          </div>

          {/* Battery & Health */}
          <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Telemetry Battery</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-400">{selectedStation.battery_level_pct}%</span>
            </div>
            <div className="text-xs text-slate-400">
              Health Status: <span className="text-emerald-400 font-bold">{selectedStation.status}</span>
            </div>
          </div>

          {/* Geotechnical Zone */}
          <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Monitored Basin</span>
              <Radio className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-100 truncate">
              {selectedStation.zone_code}
            </div>
            <div className="text-xs text-slate-400">
              Elevation: <span className="text-slate-200 font-bold">{selectedStation.elevation_m}m MSL</span>
            </div>
          </div>
        </div>
      )}

      {/* 24-Hour Telemetry Curve (Recharts) */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              24-Hour Geotechnical Stability Progression
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pore-Water Pressure (kPa) and Cumulative Surface Displacement (mm)
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            Sampling: 1-Hour Telemetry Bursts
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 11 }} unit=" kPa" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} unit=" mm" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line yAxisId="left" type="monotone" dataKey="porePressure" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Pore Pressure (kPa)" />
              <Line yAxisId="right" type="monotone" dataKey="displacement" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="Downslope Displacement (mm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
