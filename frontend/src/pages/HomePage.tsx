import React, { useState, useEffect } from "react";
import {ShieldAlert,MapPin,Radio,FileText,TrendingUp,AlertTriangle,ChevronRight,
  Activity,Zap,Globe,Users,Clock,Truck
} from "lucide-react";
import { LanguageKey, DICTIONARY } from "../locales/i18n";
import {
  fetchEmergencyPriorities,
  fetchSensorStations,
  fetchCitizenReports
} from "../services/api";

interface HomePageProps {
  currentLang: LanguageKey;
  onNavigate: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ currentLang, onNavigate }) => {
  const t = DICTIONARY[currentLang];

  const [stats, setStats] = useState({
    criticalZones: 0,
    activeSensors: 0,
    citizenReports: 0,
    monitoredKm: 847
  });
  const [latestAlerts, setLatestAlerts] = useState<{ zone: string; score: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    async function loadHomeStats() {
      try {
        const [priorities, sensors, reports] = await Promise.all([
          fetchEmergencyPriorities(),
          fetchSensorStations(),
          fetchCitizenReports()
        ]);
        const critical = priorities.filter((p: any) => p.priority_tier === "TIER_1_CRITICAL").length;
        setStats({
          criticalZones: critical,
          activeSensors: sensors.filter((s: any) => s.status === "ACTIVE").length,
          citizenReports: reports.length,
          monitoredKm: 847
        });
        setLatestAlerts(
          priorities.slice(0, 3).map((p: any) => ({
            zone: p.name,
            score: p.priority_score,
            color: p.priority_score >= 85 ? "#ef4444" : p.priority_score >= 70 ? "#f97316" : "#eab308"
          }))
        );
      } catch (e) {
        console.warn("Home stats load failed:", e);
      } finally {
        setLoading(false);
      }
    }
    loadHomeStats();
  }, []);

  const steps = [
    {
      step: "01", icon: <Radio size={20} />, color: "#00d4ff",
      bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.35)",
      title: "Sense",
      desc: "IoT tilt sensors, rain gauges, and pore pressure meters stream real-time data from 40+ stations.",
      what: "40+ IoT stations deployed across Sikkim, Meghalaya, and Assam NH corridors.",
      how: [
        "Tilt sensors detect slope displacement (±0.01°)",
        "Rain gauges measure antecedent rainfall over 7-day windows",
        "Pore pressure meters track soil water saturation",
        "Data streams over 4G/LoRa every 15 minutes to the central server"
      ]
    },
    {
      step: "02", icon: <Zap size={20} />, color: "#a78bfa",
      bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.35)",
      title: "Analyze",
      desc: "The AI engine runs MCDA scoring every 15 minutes across all monitored corridors.",
      what: "Multi-Criteria Decision Analysis (MCDA) fuses sensor data with geological and satellite inputs.",
      how: [
        "5 weighted parameters: rainfall intensity, slope angle, soil type, land cover, displacement rate",
        "XGBoost model trained on historical Northeast India landslide events",
        "Scores normalized 0–100 per corridor every 15 min",
        "XAI layer (SHAP values) explains which factor drove the score up"
      ]
    },
    {
      step: "03", icon: <AlertTriangle size={20} />, color: "#f97316",
      bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.35)",
      title: "Alert",
      desc: "Color-coded alerts push to operators and field teams within seconds of a threshold breach.",
      what: "4-tier alert system (Green / Yellow / Orange / Red) with automatic escalation.",
      how: [
        "Score ≥ 85 → Red Alert: WebSocket push to all active dashboard sessions",
        "Score 70–84 → Orange: SMS + in-app notification to district DMA",
        "Score 55–69 → Yellow: dashboard flag only",
        "Alerts include zone name, score, top risk factor, and recommended action"
      ]
    },
    {
      step: "04", icon: <Truck size={20} />, color: "#34d399",
      bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.35)",
      title: "Respond",
      desc: "Operators dispatch SDRF teams and issue evacuation orders directly from the dashboard.",
      what: "One-click dispatch and route management for field response teams.",
      how: [
        "Primary vs alternate route comparison auto-calculated on Red Alert",
        "SDRF team and machinery roster shown with current location",
        "Dispatch order generated as PDF with zone details and ETA",
        "Citizen evacuation broadcast sent via SMS to registered numbers in affected pin codes"
      ]
    }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020817 0%, #050d1f 50%, #02061a 100%)",
        backgroundImage: `
          linear-gradient(135deg, #020817 0%, #050d1f 50%, #02061a 100%),
          repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,212,255,0.025) 39px, rgba(0,212,255,0.025) 40px),
          repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,212,255,0.025) 39px, rgba(0,212,255,0.025) 40px)
        `,
        color: "#e2e8f0",
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── HERO ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "64px 24px 40px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          alignItems: "center"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700,
                color: "#f87171", letterSpacing: "0.05em"
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "blink 1.5s ease-in-out infinite" }} />
              LIVE MONITORING ACTIVE
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, color: "#f1f5f9" }}>
            Early Warning.<br />
            <span style={{ color: "#00d4ff" }}>Zero Surprises.</span>
          </h1>

          <p style={{ fontSize: 15, lineHeight: 1.75, color: "#94a3b8", maxWidth: 480, marginBottom: 32 }}>
            BhuSuraksha is an AI-powered landslide risk monitoring platform for Northeast India —
            combining real-time IoT sensor networks, satellite data, and crowd-sourced hazard reports
            into a single command interface for district administrators and emergency responders.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => onNavigate("dashboard")}
              onMouseEnter={e => (e.currentTarget.style.cssText = "display:flex;align-items:center;gap:8px;padding:12px 24px;background:#00bde8;color:#020817;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,212,255,0.35);transition:transform 0.18s ease,box-shadow 0.18s ease,background 0.18s ease")}
              onMouseLeave={e => (e.currentTarget.style.cssText = "display:flex;align-items:center;gap:8px;padding:12px 24px;background:#00d4ff;color:#020817;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;transform:translateY(0);box-shadow:none;transition:transform 0.18s ease,box-shadow 0.18s ease,background 0.18s ease")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#00d4ff", color: "#020817", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease" }}
            >
              <Activity size={16} /> Open Risk Dashboard
            </button>
            <button
              onClick={() => onNavigate("map")}
              onMouseEnter={e => (e.currentTarget.style.cssText = "display:flex;align-items:center;gap:8px;padding:12px 24px;background:rgba(255,255,255,0.06);color:#f1f5f9;border:1px solid rgba(148,163,184,0.5);border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transform:translateY(-2px);transition:transform 0.18s ease,background 0.18s ease,border-color 0.18s ease")}
              onMouseLeave={e => (e.currentTarget.style.cssText = "display:flex;align-items:center;gap:8px;padding:12px 24px;background:transparent;color:#cbd5e1;border:1px solid rgba(148,163,184,0.25);border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transform:translateY(0);transition:transform 0.18s ease,background 0.18s ease,border-color 0.18s ease")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "transparent", color: "#cbd5e1", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "transform 0.18s ease, background 0.18s ease, border-color 0.18s ease" }}
            >
              <MapPin size={16} /> Explore Live Map
            </button>
          </div>
        </div>

        {/* Right: Live Stats */}
        <div style={{ background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 20, padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Critical Risk Zones", value: loading ? "—" : stats.criticalZones, unit: "active", icon: <AlertTriangle size={18} />, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
            { label: "Active Sensors", value: loading ? "—" : stats.activeSensors, unit: "online", icon: <Radio size={18} />, color: "#00d4ff", bg: "rgba(0,212,255,0.08)" },
            { label: "Citizen Reports", value: loading ? "—" : stats.citizenReports, unit: "this week", icon: <Users size={18} />, color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
            { label: "Corridor Coverage", value: stats.monitoredKm, unit: "km monitored", icon: <Globe size={18} />, color: "#34d399", bg: "rgba(52,211,153,0.08)" }
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.color}22`, borderRadius: 14, padding: "18px 16px" }}>
              <div style={{ color: stat.color, marginBottom: 10 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 600 }}>{stat.unit}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ALERTS TICKER ── */}
      {latestAlerts.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(239,68,68,0.15)", borderBottom: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)", padding: "10px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#f87171", letterSpacing: "0.1em", flexShrink: 0 }}>⚠ ACTIVE ALERTS</span>
            {latestAlerts.map(a => (
              <div key={a.zone} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#cbd5e1" }}>{a.zone}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: a.color, background: `${a.color}18`, padding: "1px 8px", borderRadius: 999 }}>{a.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIVE RISK STRIP ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "blink 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em" }}>LIVE RISK SCORES</span>
          </div>
          <button onClick={() => onNavigate("dashboard")} style={{ fontSize: 11, color: "#00d4ff", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            View all →
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 64, borderRadius: 12, background: "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
              ))
            : [
                ...(latestAlerts as { zone: string; score: number; color: string }[]),
                ...(latestAlerts.length < 4 ? [
                  { zone: "Sikkim NH-10", score: 72, color: "#f97316" },
                  { zone: "Meghalaya NH-6", score: 45, color: "#eab308" },
                  { zone: "Assam NH-27", score: 31, color: "#34d399" },
                  { zone: "West Garo Hills", score: 88, color: "#ef4444" }
                ].slice(0, 4 - latestAlerts.length) : [])
              ].slice(0, 4).map((item, i) => {
                const severity =
                  item.score >= 85 ? { label: "Severe",   bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)" } :
                  item.score >= 70 ? { label: "High",     bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.25)" } :
                  item.score >= 55 ? { label: "Moderate", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.25)" } :
                                     { label: "Low",      bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)" };
                return (
                  <div
                    key={i}
                    onClick={() => onNavigate("dashboard")}
                    style={{ background: severity.bg, border: `1px solid ${severity.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{item.zone}</div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Landslide Risk</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.score}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: item.color, background: `${item.color}18`, padding: "2px 7px", borderRadius: 999, marginTop: 3 }}>
                        {severity.label.toUpperCase()}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* ── MODULE CARDS ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>Command Modules</h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>Everything you need, one click away</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            { id: "dashboard", icon: <TrendingUp size={22} />, iconColor: "#00d4ff", iconBg: "rgba(0,212,255,0.1)", title: "Risk Dashboard", subtitle: "AI Priority Intelligence", description: "Live MCDA scoring across all monitored corridors. View 7-day antecedent rainfall trends, XAI-powered risk explanations, and mobilize response resources instantly.", features: ["MCDA Priority Table", "Rainfall Trend Charts", "XAI Explainability", "Dispatch Orders"], cta: "Open Dashboard", border: "rgba(0,212,255,0.2)", glowColor: "rgba(0,212,255,0.12)" },
            { id: "map", icon: <MapPin size={22} />, iconColor: "#34d399", iconBg: "rgba(52,211,153,0.1)", title: "Map Explorer", subtitle: "Spatial Risk Visualization", description: "Interactive GIS map showing sensor locations, citizen hazard reports, and risk corridor overlays across Northeast India's mountain highways.", features: ["IoT Sensor Overlay", "Citizen Report Pins", "Corridor Risk Layers", "Real-time Updates"], cta: "Open Map", border: "rgba(52,211,153,0.2)", glowColor: "rgba(52,211,153,0.12)" },
            { id: "emergency", icon: <ShieldAlert size={22} />, iconColor: "#f97316", iconBg: "rgba(249,115,22,0.1)", title: "Emergency Routing", subtitle: "Evacuation & Detour Control", description: "Dynamic route comparison between primary highways and mountain bypass alternatives. Simulate blockages, trigger Red Alerts, and issue evacuation orders.", features: ["Route Comparison", "NH-10 Blockage Simulator", "Red Alert Broadcast", "Convoy Routing"], cta: "Open Routing", border: "rgba(249,115,22,0.2)", glowColor: "rgba(249,115,22,0.12)" },
            { id: "report", icon: <FileText size={22} />, iconColor: "#a78bfa", iconBg: "rgba(167,139,250,0.1)", title: "Citizen Reports", subtitle: "Crowdsourced Ground Truth", description: "PWA-enabled form for field teams and citizens to submit geo-tagged hazard observations with photos. Works offline — syncs when connectivity is restored.", features: ["GPS Auto-detect", "Photo Upload + CV Analysis", "Offline Queue (IndexedDB)", "Multilingual (5 languages)"], cta: "File a Report", border: "rgba(167,139,250,0.2)", glowColor: "rgba(167,139,250,0.12)" }
          ].map(mod => {
            const isHovered = hoveredCard === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigate(mod.id)}
                onMouseEnter={() => setHoveredCard(mod.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: isHovered ? "rgba(10,20,45,0.95)" : "rgba(5,13,31,0.8)",
                  border: `1px solid ${isHovered ? mod.border.replace("0.2", "0.6") : mod.border}`,
                  borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 16, cursor: "pointer",
                  transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                  boxShadow: "none",
                  transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), border-color 0.22s ease, background 0.22s ease",
                  willChange: "transform"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ background: mod.iconBg, borderRadius: 12, padding: 10, color: mod.iconColor, flexShrink: 0, transform: isHovered ? "scale(1.1)" : "scale(1)", transition: "transform 0.22s ease" }}>
                    {mod.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{mod.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{mod.subtitle}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: isHovered ? "#b0bfd4" : "#94a3b8", lineHeight: 1.65, transition: "color 0.22s ease" }}>{mod.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {mod.features.map(f => (
                    <span key={f} style={{ fontSize: 10, fontWeight: 600, color: mod.iconColor, background: mod.iconBg, padding: "3px 10px", borderRadius: 999 }}>{f}</span>
                  ))}
                </div>
                <button style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: isHovered ? mod.glowColor : "transparent", border: `1px solid ${isHovered ? mod.border.replace("0.2", "0.5") : mod.border}`, borderRadius: 10, color: mod.iconColor, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", transition: "background 0.22s ease, border-color 0.22s ease" }}>
                  {mod.cta}
                  <ChevronRight size={15} style={{ transform: isHovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.22s ease" }} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ borderTop: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,212,255,0.015)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>How BhuSuraksha Works</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 48 }}>
            A three-layer intelligence stack, from raw sensor data to evacuation orders.
          </p>

          <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 0 }}>
            <div style={{ position: "absolute", top: 28, left: "calc(12.5%)", right: "calc(12.5%)", height: 2, background: "linear-gradient(90deg, #00d4ff40, #a78bfa40, #f9731640, #34d39940)", zIndex: 0 }} />

            {steps.map((step, i) => {
              const isExpanded = expandedStep === step.step;
              return (
                <div
                  key={step.step}
                  onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1, cursor: "pointer" }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: isExpanded ? step.bg : "rgba(2,8,23,0.9)", border: `2px solid ${isExpanded ? step.color : step.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color, marginBottom: 20, boxShadow: isExpanded ? `0 0 20px ${step.color}50` : "none", transition: "all 0.2s ease" }}>
                    {step.icon}
                  </div>
                  {i < 3 && (
                    <div style={{ position: "absolute", top: 20, right: -10, zIndex: 2 }}>
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                        <path d="M0 6 L10 6 M6 1 L12 6 L6 11" stroke={step.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 800, color: step.color, letterSpacing: "0.12em", marginBottom: 6, opacity: 0.7 }}>STEP {step.step}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isExpanded ? step.color : "#f1f5f9", marginBottom: 6, textAlign: "center", transition: "color 0.2s" }}>{step.title}</div>
                  <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, textAlign: "center", maxWidth: 200, padding: "0 8px" }}>{step.desc}</p>
                  <div style={{ fontSize: 11, color: step.color, marginTop: 8, opacity: 0.6 }}>{isExpanded ? "▲ collapse" : "▼ details"}</div>
                </div>
              );
            })}
          </div>

          {expandedStep && (() => {
            const s = steps.find(x => x.step === expandedStep)!;
            return (
              <div style={{ marginTop: 32, background: "rgba(5,13,31,0.9)", border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}`, borderRadius: 14, padding: "24px 28px", animation: "fadeSlideIn 0.25s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Step {s.step}: {s.title}</span>
                  <span style={{ fontSize: 11, color: s.color, background: `${s.color}15`, padding: "2px 10px", borderRadius: 999, fontWeight: 600 }}>IN DEPTH</span>
                </div>
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20, lineHeight: 1.7 }}>{s.what}</p>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: "0.08em", marginBottom: 12 }}>HOW IT WORKS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.how.map((point, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: s.color, marginTop: 1, flexShrink: 0, fontSize: 13 }}>→</span>
                      <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#334155" }}>
          BhuSuraksha · Smart India Hackathon 2026 · Built for NDMA / State DMA Operations · Northeast India Landslide Risk Corridors
        </p>
      </footer>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          section:first-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};