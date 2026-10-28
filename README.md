# BhuSuraksha 🛡️
**AI-Based Early Warning & Landslide Risk Monitoring System for Northeast India**

---

## Overview

BhuSuraksha is a proactive, AI-powered disaster intelligence platform for the landslide-prone North Eastern Region (NER) of India. It fuses real-time weather data, terrain analysis, IoT telemetry, and citizen reports to predict landslide risk and dispatch multilingual early warnings — before failure occurs.

---

## Key Features

- **Real-time Risk Scoring** — XGBoost/LightGBM model combining static terrain (slope, TWI, lithology) with dynamic rainfall (antecedent precipitation index) to generate 0–100 susceptibility scores
- **Computer Vision Triage** — YOLOv8-Nano detects ground cracks, debris flows, and road blockages from citizen-uploaded photos
- **GIS Command Dashboard** — Live risk heatmaps, road vulnerability overlays, and sensor telemetry for district authorities
- **Citizen PWA** — Offline-first mobile reporting with IndexedDB queuing, auto-sync, and GPS geo-tagging
- **Multilingual Alerts** — Geo-fenced warnings in English, Hindi, Assamese, Bengali, and Mizo
- **Emergency Prioritization** — MCDA algorithm ranks districts and roads by `P(hazard) × (road criticality + population exposure)`
- **Explainable AI** — SHAP breakdowns show *why* each alert fired (e.g. "72h rain 52% + Slope 41° 31%")

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Leaflet, Recharts, i18next |
| Backend | FastAPI (Python 3.11), SQLAlchemy 2.0, PostGIS, Redis |
| AI/ML | XGBoost, SHAP, YOLOv8-Nano, ONNX Runtime |
| GIS | GeoPandas, Rasterio, GDAL, PostGIS ST_AsMVT |
| Infra | Docker Compose (PostgreSQL 16 + PostGIS + Redis) |

---

## Project Structure

```
Landslide-Risk-Monitoring-System/
├── frontend/          # React PWA (Vite + TypeScript)
├── backend/           # FastAPI REST + WebSocket API
├── ai_ml/             # Model training, ONNX export, CV inference
├── gis_pipeline/      # DEM processing, slope/TWI, OSM road extraction
└── docker-compose.yml
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Nimisha8/Bhusuraksha.git
cd Bhusuraksha

# 2. Start PostgreSQL + Redis (requires Docker)
docker-compose up -d

# 3. Set up Python backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r backend/requirements.txt

# 4. Run the backend
.venv\Scripts\python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# 5. Run the frontend (in a new terminal)
cd frontend
npm install
npm run dev

# 6. (Optional) Trigger monsoon simulation demo
.venv\Scripts\python scripts/simulate_cloudburst.py
```

**Backend:** http://localhost:8000 · **Frontend:** http://localhost:5173 · **API Docs:** http://localhost:8000/docs

---

## Data Sources

| Type | Source |
|---|---|
| Live Rainfall | Open-Meteo API (free, no key, 0.05° resolution) |
| Terrain DEM | 30m SRTM / ALOS GeoTIFF (NER pilot zones) |
| Road Networks | OpenStreetMap via Overpass API |
| Landslide History | NASA Global Landslide Catalog + GSI records |
| IoT Sensors | Simulated piezometer / tiltmeter telemetry |

---

## Risk Classification

| Score | Level | Action |
|---|---|---|
| ≥ 80 | 🔴 Critical | NDRF prepositioning, road closure, evacuation |
| 50–79 | 🟠 High | District advisory, road patrol, machinery standby |
| 25–49 | 🟡 Moderate | Automated monitoring, public travel advisory |
| < 25 | 🟢 Low | Routine surveillance |

---

## Tests

```bash
.venv\Scripts\pytest backend\tests -v
```

---

*Built for disaster resilience in Northeast India's most vulnerable corridors — NH-10 (Sikkim), NH-6 (Assam/Meghalaya), NH-29 (Nagaland).*
