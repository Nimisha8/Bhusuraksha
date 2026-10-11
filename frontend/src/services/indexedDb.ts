import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "geosurge_offline_db";
const STORE_NAME = "reports_queue";

export interface QueuedReport {
  id?: number;
  client_uuid: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  state?: string;
  district?: string;
  hazard_type: string;
  severity: string;
  description?: string;
  image_data_base64?: string;
  offline_created_timestamp: number;
  sync_status: "PENDING" | "SYNCED" | "FAILED";
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
          });
          store.createIndex("client_uuid", "client_uuid", { unique: true });
        }
      }
    });
  }
  return dbPromise;
}

export async function queueOfflineReport(report: Omit<QueuedReport, "id" | "sync_status">): Promise<number> {
  const db = await getDb();
  const id = await db.add(STORE_NAME, {
    ...report,
    sync_status: "PENDING"
  });
  return id as number;
}

export async function getQueuedReports(): Promise<QueuedReport[]> {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function getQueuedCount(): Promise<number> {
  const db = await getDb();
  return db.count(STORE_NAME);
}

export async function clearQueuedReport(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function syncAllQueuedReports(): Promise<{ synced: number; failed: number }> {
  const reports = await getQueuedReports();
  if (reports.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const payload = {
    reports: reports.map(r => ({
      client_uuid: r.client_uuid,
      latitude: r.latitude,
      longitude: r.longitude,
      location_name: r.location_name,
      state: r.state,
      district: r.district,
      hazard_type: r.hazard_type,
      severity: r.severity,
      description: r.description,
      image_url: r.image_data_base64 ? "/uploads/offline_sync_photo.jpg" : null,
      offline_created_timestamp: r.offline_created_timestamp
    }))
  };

  try {
    const res = await fetch("/api/v1/reports/bulk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      // Remove successfully synced items from IndexedDB
      const db = await getDb();
      for (const r of reports) {
        if (r.id) {
          await db.delete(STORE_NAME, r.id);
        }
      }
      return { synced: data.synced_count || reports.length, failed: 0 };
    } else {
      return { synced: 0, failed: reports.length };
    }
  } catch (err) {
    console.warn("[Offline Sync] Unable to sync queued reports (network still unreachable):", err);
    return { synced: 0, failed: reports.length };
  }
}
