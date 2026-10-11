import { EarlyWarningAlert } from "./api";

type AlertCallback = (alert: EarlyWarningAlert) => void;

class AlertWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: AlertCallback[] = [];
  private reconnectInterval = 3000;
  private isConnected = false;

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.port === "5173" ? "127.0.0.1:8000" : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/alerts`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log("[WebSocket] Connected to GeoSurge alert feed:", wsUrl);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.alert_id && data.color_code) {
            this.notifyListeners(data as EarlyWarningAlert);
          }
        } catch (err) {
          console.error("[WebSocket] Error parsing alert message:", err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log(`[WebSocket] Disconnected. Reconnecting in ${this.reconnectInterval}ms...`);
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.ws.onerror = (err) => {
        console.warn("[WebSocket] Error on alert channel:", err);
      };
    } catch (e) {
      console.warn("[WebSocket] Failed to establish connection:", e);
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  public subscribe(callback: AlertCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(alert: EarlyWarningAlert) {
    this.listeners.forEach(cb => {
      try {
        cb(alert);
      } catch (err) {
        console.error("[WebSocket] Listener callback error:", err);
      }
    });
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const alertWebSocketService = new AlertWebSocketService();
