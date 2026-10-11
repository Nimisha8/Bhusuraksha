import React from "react";
import { AlertTriangle, Activity, Map, ShieldAlert, Camera, Globe, Wifi, WifiOff, Home } from "lucide-react";
import { LanguageKey, DICTIONARY } from "../locales/i18n";
import { EarlyWarningAlert } from "../services/api";

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentLang: LanguageKey;
  onSelectLang: (lang: LanguageKey) => void;
  isOnline: boolean;
  queuedReportsCount: number;
  latestAlert: EarlyWarningAlert | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab, onSelectTab, currentLang, onSelectLang,
  isOnline, queuedReportsCount, latestAlert
}) => {
  const t = DICTIONARY[currentLang];

  const navItems = [
    { id: "home",      icon: "home",     label: "Home" },
    { id: "dashboard", icon: "activity", label: t.navDashboard },
    { id: "map",       icon: "map",      label: t.navMap },
    { id: "emergency", icon: "alert",    label: t.navEmergency },
    { id: "report",    icon: "camera",   label: t.navReport },
  ];

  const NavIcon: React.FC<{ type: string; size?: string }> = ({ type, size = "w-3.5 h-3.5" }) => {
    if (type === "home")     return <Home className={size} />;
    if (type === "activity") return <Activity className={size} />;
    if (type === "map")      return <Map className={size} />;
    if (type === "alert")    return <AlertTriangle className={size} />;
    if (type === "camera")   return <Camera className={size} />;
    return null;
  };

  // Build ticker text — duplicate it so the scroll loops seamlessly
  const tickerText = latestAlert
    ? `⚠ ${latestAlert.titles[currentLang] || latestAlert.titles["en"]} — ${latestAlert.messages[currentLang] || latestAlert.messages["en"]}  ·  RISK SCORE: ${latestAlert.risk_score}  ·  `
    : "";

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">

      {/* ── Scrolling Alert Ticker ── */}
      {latestAlert && latestAlert.color_code === "RED" && (
        <div style={{
          background: "#dc2626", color: "#fff",
          fontSize: 12, fontWeight: 700,
          padding: "6px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center"
        }}>
          {/* Static icon on the left */}
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
            padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.2)",
            marginRight: 0
          }}>
            <AlertTriangle style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em" }}>LIVE ALERT</span>
          </div>
          {/* Scrolling text */}
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ display: "inline-flex", animation: "tickerScroll 18s linear infinite" }}>
              <span style={{ paddingRight: 80 }}>{tickerText}</span>
              <span style={{ paddingRight: 80 }}>{tickerText}</span>
            </div>
          </div>
          {/* Static score badge on right */}
          <div style={{
            flexShrink: 0, background: "rgba(0,0,0,0.25)",
            padding: "2px 12px", marginLeft: 0,
            borderLeft: "1px solid rgba(255,255,255,0.2)",
            fontSize: 11, fontWeight: 800
          }}>
            {latestAlert.risk_score}
          </div>
        </div>
      )}

      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onSelectTab("home")}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                BhuSuraksha
              </span>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5">{t.subTitle}</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === item.id
                    ? "bg-slate-800 text-cyan-400 shadow-sm shadow-black border border-slate-700/60"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <NavIcon type={item.icon} />
                {item.label}
                {item.id === "report" && queuedReportsCount > 0 && (
                  <span className="bg-cyan-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {queuedReportsCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              isOnline
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/80"
                : "bg-rose-950/60 text-rose-400 border-rose-800/80 animate-pulse"
            }`}
              title={isOnline ? "Live Network Synchronized" : "Working in Offline Mode."}>
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <Wifi className="w-3 h-3" />
                  <span className="hidden sm:inline">LIVE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>OFFLINE ({queuedReportsCount})</span>
                </>
              )}
            </div>

            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={currentLang}
                onChange={(e) => onSelectLang(e.target.value as LanguageKey)}
                aria-label="Select Language"
                className="bg-slate-800/90 text-slate-200 border border-slate-700 text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer font-medium"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिन्दी (HI)</option>
                <option value="as">অসমীয়া (AS)</option>
                <option value="bn">বাংলা (BN)</option>
                <option value="mzo">Mizo (MZO)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center text-[10px] relative ${
              currentTab === item.id ? "text-cyan-400" : "text-slate-400"
            }`}
          >
            <NavIcon type={item.icon} size="w-4 h-4" />
            <span>{item.label}</span>
            {item.id === "report" && queuedReportsCount > 0 && (
              <span className="absolute -top-1 right-2 bg-cyan-500 text-black text-[9px] font-bold px-1 rounded-full">
                {queuedReportsCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};