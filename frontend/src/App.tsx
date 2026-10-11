import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { DashboardPage } from "./pages/DashboardPage";
import { MapExplorerPage } from "./pages/MapExplorerPage";
import { EmergencyTriagePage } from "./pages/EmergencyTriagePage";
import { CitizenReportPage } from "./pages/CitizenReportPage";
import { LanguageKey } from "./locales/i18n";
import { EarlyWarningAlert } from "./services/api";
import { getQueuedCount } from "./services/indexedDb";
import { alertWebSocketService } from "./services/websocket";
import { HomePage } from "./pages/HomePage";

// ── Page transition wrapper ──────────────────────────────
const AnimatedPage: React.FC<{ children: React.ReactNode; tabKey: string }> = ({ children, tabKey }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [tabKey]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.3s ease, transform 0.3s ease"
    }}>
      {children}
    </div>
  );
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [currentLang, setCurrentLang] = useState<LanguageKey>("en");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [latestAlert, setLatestAlert] = useState<EarlyWarningAlert | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    updateQueuedCount();
    alertWebSocketService.connect();
    const unsubscribe = alertWebSocketService.subscribe((alert) => setLatestAlert(alert));
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  const updateQueuedCount = async () => {
    try {
      const count = await getQueuedCount();
      setQueuedCount(count);
    } catch (e) {
      console.warn("Could not check IndexedDB queue count:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        isOnline={isOnline}
        queuedReportsCount={queuedCount}
        latestAlert={latestAlert}
      />

      {/* Page transition wraps the entire main area, key changes on tab switch */}
      <main className="flex-1 overflow-y-auto">
        <AnimatedPage tabKey={currentTab}>
          {currentTab === "home"      && <HomePage currentLang={currentLang} onNavigate={setCurrentTab} />}
          {currentTab === "dashboard" && <DashboardPage currentLang={currentLang} onNavigateMap={() => setCurrentTab("map")} />}
          {currentTab === "map"       && <MapExplorerPage />}
          {currentTab === "emergency" && <EmergencyTriagePage />}
          {currentTab === "report"    && <CitizenReportPage currentLang={currentLang} isOnline={isOnline} onQueueUpdated={updateQueuedCount} />}
        </AnimatedPage>
      </main>
    </div>
  );
};

export default App;