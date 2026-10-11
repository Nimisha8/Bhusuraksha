import React, { useState, useEffect } from "react";
import {
  fetchEvacuationRoutes,
  updateRoadStatus,
  broadcastAlert
} from "../services/api";
import {
  AlertTriangle,
  Compass,
  Navigation,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

export const EmergencyTriagePage: React.FC = () => {
  const [detourData, setDetourData] = useState<any>(null);
  const [selectedOrigin, setSelectedOrigin] = useState("Gangtok");
  const [selectedDest, setSelectedDest] = useState("Siliguri");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const routeRes = await fetchEvacuationRoutes(selectedOrigin, selectedDest);
      setDetourData(routeRes);
    } catch (err) {
      console.error("Failed to load route data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOrigin, selectedDest]);

  const handleSimulateBlockage = async () => {
    setSimulating(true);
    try {
      await updateRoadStatus("ROAD-SKM-NH10-S1", "BLOCKED");
      await broadcastAlert({
        zone_code: "SKM-NH10-Z2",
        zone_name: "Teesta Bazar Gorge",
        corridor_name: "NH-10",
        color_code: "RED",
        risk_score: 92.5,
        district: "Kalimpong Border / South Sikkim",
        state: "Sikkim"
      });
      await loadData();
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setSimulating(false);
    }
  };

  const handleClearBlockage = async () => {
    setSimulating(true);
    try {
      await updateRoadStatus("ROAD-SKM-NH10-S1", "OPEN");
      await loadData();
    } catch (e) {
      console.error("Clear error:", e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={{
      maxWidth: 900,
      margin: "0 auto",
      padding: "32px 24px",
      background: "linear-gradient(135deg, #020817 0%, #050d1f 100%)",
      minHeight: "100vh",
      color: "#e2e8f0"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Compass size={20} color="#f59e0b" />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
            Emergency Evacuation & Detour Routing
          </h1>
        </div>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
          Dynamic bypass routing for ambulances, supply convoys, and civilian evacuation when lifeline corridors are severed.
        </p>
      </div>

      {/* Simulation Controls */}
      <div style={{
        background: "rgba(239,68,68,0.04)",
        border: "1px solid rgba(239,68,68,0.15)",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 2 }}>
            NH-10 Corridor Simulation
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Simulate a landslide blockage on the Teesta Gorge section to test alternate routing
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSimulateBlockage}
            disabled={simulating}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px",
              background: simulating ? "#7f1d1d" : "#dc2626",
              color: "#fff", border: "none", borderRadius: 9,
              fontSize: 12, fontWeight: 700, cursor: simulating ? "not-allowed" : "pointer",
              opacity: simulating ? 0.7 : 1
            }}
          >
            {simulating
              ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
              : <AlertTriangle size={13} />
            }
            Simulate NH-10 Severance
          </button>
          <button
            onClick={handleClearBlockage}
            disabled={simulating}
            style={{
              padding: "9px 18px",
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: 9,
              fontSize: 12, fontWeight: 600,
              cursor: simulating ? "not-allowed" : "pointer"
            }}
          >
            Clear Route
          </button>
        </div>
      </div>

      {/* Route Comparison */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <RefreshCw size={22} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />
          Loading route data…
        </div>
      ) : detourData && (
        <div style={{
          background: "rgba(5,13,31,0.8)",
          border: "1px solid #1e293b",
          borderRadius: 18,
          overflow: "hidden"
        }}>
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid #1e293b",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Navigation size={15} color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{detourData.corridor}</span>
            </div>
            <span style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 800,
              letterSpacing: "0.06em",
              background: detourData.rerouting_active ? "rgba(127,29,29,0.6)" : "rgba(5,46,22,0.6)",
              color: detourData.rerouting_active ? "#fca5a5" : "#86efac",
              border: `1px solid ${detourData.rerouting_active ? "rgba(220,38,38,0.4)" : "rgba(34,197,94,0.3)"}`,
              ...(detourData.rerouting_active ? { animation: "blink 1.5s ease-in-out infinite" } : {})
            }}>
              {detourData.rerouting_active ? "DETOUR ROUTING ACTIVE" : "PRIMARY CORRIDOR OPERATIONAL"}
            </span>
          </div>

          <div style={{
            padding: "12px 24px",
            background: detourData.rerouting_active ? "rgba(127,29,29,0.15)" : "rgba(5,46,22,0.15)",
            borderBottom: "1px solid #1e293b",
            display: "flex", alignItems: "flex-start", gap: 10
          }}>
            {detourData.rerouting_active
              ? <AlertTriangle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
              : <CheckCircle2 size={15} color="#4ade80" style={{ flexShrink: 0, marginTop: 1 }} />
            }
            <p style={{
              fontSize: 12, lineHeight: 1.65, margin: 0,
              color: detourData.rerouting_active ? "#fca5a5" : "#86efac",
              fontWeight: 500
            }}>
              {detourData.recommendation_summary}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {/* Primary route */}
            <div style={{ padding: 24, borderRight: "1px solid #1e293b", opacity: detourData.primary_route.is_recommended ? 1 : 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#64748b", letterSpacing: "0.1em" }}>PRIMARY HIGHWAY</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: detourData.primary_route.status.includes("BLOCKED") ? "rgba(127,29,29,0.5)" : "rgba(5,46,22,0.5)",
                  color: detourData.primary_route.status.includes("BLOCKED") ? "#fca5a5" : "#86efac"
                }}>
                  {detourData.primary_route.status}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
                {detourData.primary_route.route_name}
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                <span>Distance: <strong style={{ color: "#f1f5f9" }}>{detourData.primary_route.distance_km} km</strong></span>
                <span>ETA: <strong style={{ color: "#fbbf24" }}>{detourData.primary_route.estimated_travel_time_hours} hrs</strong></span>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", margin: 0 }}>
                {detourData.primary_route.hazard_exposure}
              </p>
            </div>

            {/* Alternative route */}
            <div style={{ padding: 24, background: detourData.alternative_route.is_recommended ? "rgba(245,158,11,0.03)" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#64748b", letterSpacing: "0.1em" }}>SAFE BYPASS ROUTE</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: "rgba(78,44,0,0.5)", color: "#fcd34d",
                  border: "1px solid rgba(245,158,11,0.3)"
                }}>
                  {detourData.alternative_route.status}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
                {detourData.alternative_route.route_name}
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                <span>Distance: <strong style={{ color: "#f1f5f9" }}>{detourData.alternative_route.distance_km} km</strong></span>
                <span>ETA: <strong style={{ color: "#fbbf24" }}>{detourData.alternative_route.estimated_travel_time_hours} hrs</strong></span>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", margin: 0 }}>
                {detourData.alternative_route.hazard_exposure}
              </p>
              {detourData.alternative_route.is_recommended && (
                <div style={{
                  marginTop: 12, padding: "6px 12px", borderRadius: 8,
                  background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                  fontSize: 10, fontWeight: 700, color: "#fbbf24"
                }}>
                  ✓ RECOMMENDED ROUTE
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};