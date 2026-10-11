# AI-Based Early Warning & Landslide Risk Monitoring System (NER)

> **Disaster Intelligence & Early Warning Platform for the North Eastern Region of India**  

---

## Executive Summary & Problem Context

The **North Eastern Region (NER)** of India—comprising Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura—is one of the most landslide-prone zones in the world. The combination of intense monsoon cloudbursts, complex Himalayan and Indo-Burmese tectonic geologies, high seismicity (Seismic Zones V and IV), steep slopes, and cut-slope destabilization from rapid road infrastructure expansion creates frequent, devastating slope failures.

Conventional disaster management in NER remains largely **reactive** and reliant on manual damage reporting after an event has already blocked arterial highways (e.g., NH-10 connecting Sikkim, NH-29 in Nagaland, NH-6 in Meghalaya) or destroyed rural settlements.

This project delivers **GeoSurge-NER**, an end-to-end, proactive, **AI-powered Disaster Intelligence and Early Warning Platform**. By fusing multi-modal dynamic streams (meteorological forecasts, antecedent rainfall, geotechnical telemetry, citizen imagery, and road network topologies) with high-resolution static terrain models, the system predicts landslide susceptibility in real-time, prioritizes emergency response logistics, and dispatches multilingual warnings to authorities and vulnerable citizens before failure occurs.

---

## 1. High-Level System Architecture

```
                                  +--------------------------------------------------------+
                                  |              DATA INGESTION & SENSING ENGINE           |
                                  |  - Real-time Rainfall (IMD / Open-Meteo / NASA GPM)     |
                                  |  - In-Situ IoT Telemetry (Piezometers, Tiltmeters)     |
                                  |  - Satellite Imagery & DEM (SRTM, ALOS, Sentinel-2)   |
                                  |  - Road Networks & Settlements (OSM / Overpass API)    |
                                  |  - Historical Landslide Inventory (GSI / NASA GLC)     |
                                  +---------------------------+----------------------------+
                                                              |
                                                              v
+------------------------------------+    +------------------------------------------------+
|    CITIZEN & FIELD REPORTING PWA   |    |         DATA HARMONIZATION & GIS ENGINE        |
| - Geo-tagged Photo/Video Capture   |    | - Spatial Transformations (EPSG:4326/32646)    |
| - Offline Queue (IndexedDB/Workbox)|===>| - Digital Elevation Modeling (Slope/Aspect/TWI)|
| - Low-Bandwidth WebP Compression   |    | - Spatio-Temporal Raster & Vector Indexing     |
| - Multilingual (7 NER Languages)   |    | - PostGIS Spatial Database Storage             |
+------------------------------------+    +-------------------+----------------------------+
                                                              |
                                                              v
                                  +--------------------------------------------------------+
                                  |             ANALYTICS & AI INFERENCE LAYER             |
                                  |                                                        |
                                  |  +---------------------+    +-----------------------+  |
                                  |  |  DYNAMIC ML ENGINE  |    |  COMPUTER VISION CORE |  |
                                  |  | - XGBoost / LightGBM|    | - YOLOv8-Nano / Torch |  |
                                  |  | - Antecedent Precip |    | - Ground Crack Detect |  |
                                  |  | - SHAP Explainabilt |    | - Blocked Road Segm.  |  |
                                  |  +----------+----------+    +-----------+-----------+  |
                                  +-------------|---------------------------|--------------+
                                                +-------------+-------------+
                                                              |
                                                              v
                                  +--------------------------------------------------------+
                                  |       EMERGENCY PRIORITIZATION & TRIAGE ENGINE         |
                                  | - Multi-Criteria Decision Analysis (Hazard x Impact)   |
                                  | - Population & Arterial Lifeline Exposure Analysis     |
                                  | - Dynamic Evacuation Route Clearance Verification      |
                                  +---------------------------+----------------------------+
                                                              |
                                                              v
+-------------------------------------------------------------+----------------------------+
|                               API GATEWAY & REAL-TIME DISPATCH                           |
|                        FastAPI Backend | WebSockets | Redis Pub/Sub                      |
+-----------------------------+-------------------------------+----------------------------+
                              |                               |
                              v                               v
+-----------------------------------------------+   +--------------------------------------+
|          COMMAND & CONTROL DASHBOARD          |   |      MULTI-CHANNEL ALERT ENGINE      |
| - MapLibre 3D Terrain & Dynamic Risk Heatmaps |   | - Web Push Notifications             |
| - Road Vulnerability & Lifeline Status Monitor|   | - Automated District SMS / WhatsApp  |
| - Citizen Report Verification & Triage Queue  |   | - Low-Bandwidth USSD/IVR Simulation  |
| - Explainable AI (SHAP) Factor Breakdown Modal|   | - Village Dorbar / Panchayat Siren   |
+-----------------------------------------------+   +--------------------------------------+
```

---

## 2. Core Functional Modules Breakdown

| Module | Sub-Components | Key Responsibilities |
| :--- | :--- | :--- |
| **M1: Data Ingestion & Environmental Sensing** | • Weather Ingestor<br>• IoT Telemetry Streamer<br>• Satellite DEM Ingestor | Ingests real-time precipitation, 24h/72h rainfall histories, API (Antecedent Precipitation Index), simulated pore-water pressure & tilt sensor streams, and DEM raster tiles. |
| **M2: Geospatial & Terrain Processing (GIS)** | • Topographic Feature Extractor<br>• PostGIS Vector Processor<br>• Cut-Slope Buffer Engine | Computes slope, aspect, Topographic Wetness Index (TWI), curvature, flow accumulation from 30m DEM; buffers road networks (NHIDCL/BRO routes) to identify cut-slope vulnerability zones. |
| **M3: Dynamic AI/ML Risk Scoring Engine** | • Feature Normalizer<br>• Gradient-Boosted Classifier<br>• SHAP Explainer | Combines static geotechnical factors with dynamic moisture indices to generate 0–100 Landslide Susceptibility Scores at 500m grid and administrative panchayat levels. Produces human-interpretable risk drivers. |
| **M4: Computer Vision Ground Intelligence** | • EXIF / GPS Verifier<br>• YOLOv8 Defect Detector<br>• Road Obstruction Evaluator | Analyzes crowdsourced images for tension cracks in soil/pavement, active debris flows, leaning utility poles, and road blockages. Flags verified ground-truth incidents to calibrate ML risk scores. |
| **M5: Emergency Response Prioritization** | • Criticality Matrix Calculator<br>• Hospital/Supply Route Analyzer<br>• Resource Dispatch Triager | Scores districts, roads, and settlements based on risk probability $\times$ consequence severity. Generates prioritized deployment recommendations for District Disaster Management Authorities (DDMAs) and NDRF. |
| **M6: Alerting & Multilingual Dispatch** | • Notification Scheduler<br>• Multi-channel Dispatcher<br>• i18n Localization Engine | Dispatches geo-fenced red/orange/yellow advisories to administration consoles and citizen phones in English, Hindi, Assamese, Bengali, Mizo, Manipuri, and Khasi. |
| **M7: Offline-First Citizen & Field PWA** | • Service Worker Cache<br>• IndexedDB Offline Queue<br>• Image Compressor & Sync Manager | Allows field officers and citizens to capture geo-tagged reports and view cached emergency evacuation maps even in 0-network valleys; auto-synchronizes on connection restoration. |
| **M8: Command & Control GIS Dashboard** | • MapLibre / Leaflet Map Console<br>• Time-series Recharts Panel<br>• Incident Management Kanban | Provides state disaster authorities with a unified operational picture: live risk heatmaps, blocked road markers, incoming citizen report stream, and weather forecast overlays. |

---

## 3. End-to-End Data Flow

```
[External Weather API] ---> (Every 1 hr) ----> [Ingestion Pipeline]
                                                     |
                                                     v
                                             [Calculate Antecedent
                                             Precipitation Index (API)]
                                                     |
                                                     +---> [Static DEM / Terrain Features]
                                                     |     (Slope, TWI, Distance to Faults)
                                                     v
                                        +--------------------------+
                                        | ML Inference Engine      |
                                        | - XGBoost Model Predicts |
                                        |   P(Landslide) per Cell  |
                                        +------------+-------------+
                                                     |
                                                     v
[Citizen Photo/Report]                  [Dynamic Risk Score Layer]
        |                                            |
        v                                            v
[PWA IndexedDB (Offline)]               +--------------------------+
        | (Sync on connect)             | Emergency Prioritization |
        v                               | Score = P(Hazard) *      |
[FastAPI Ingestion Endpoint]            | (RoadCrit + PopExposure) |
        |                               +------------+-------------+
        v                                            |
[CV Engine (YOLOv8)]                                 v
 - Crack / Debris Verified ------------> [PostGIS Spatial DB Update]
                                                     |
                                       +-------------+-------------+
                                       |                           |
                                       v                           v
                             [WebSocket / SSE]             [Notification Engine]
                                       |                           |
                                       v                           v
                           [Command & Control Web]       [SMS / Push / WhatsApp]
```

---

## 4. Scalable Project Directory Structure

```
Landslide-Risk-Monitoring-System/
├── .github/
│   └── workflows/
│       ├── test-backend.yml
│       └── build-frontend.yml
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application factory & routes inclusion
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic v2 settings & environment variables
│   │   │   ├── database.py             # SQLAlchemy 2.0 async engine & session maker
│   │   │   ├── redis.py                # Redis client & Pub/Sub broker
│   │   │   └── security.py             # JWT token utilities & password hashing
│   │   ├── models/                     # SQLAlchemy / GeoAlchemy2 ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py                 # Citizen & Authority accounts
│   │   │   ├── report.py               # Citizen geo-tagged reports & CV analysis results
│   │   │   ├── alert.py                # Early warning logs & broadcast statuses
│   │   │   ├── sensor.py               # In-situ sensor telemetry records
│   │   │   └── risk_zone.py            # Spatial grid cells & administrative boundaries
│   │   ├── schemas/                    # Pydantic request/response validation
│   │   │   ├── report.py
│   │   │   ├── alert.py
│   │   │   ├── prediction.py
│   │   │   └── priority.py
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── router.py           # Unified v1 API router
│   │   │   │   ├── auth.py             # Authentication & user profile endpoints
│   │   │   │   ├── weather.py          # Weather fetching & forecasting endpoints
│   │   │   │   ├── sensors.py          # IoT sensor ingestion & telemetry queries
│   │   │   │   ├── gis.py              # Spatial layers, GeoJSON, risk tiles
│   │   │   │   ├── predictions.py      # ML hazard prediction & SHAP explainability
│   │   │   │   ├── reports.py          # Citizen crowdsourcing, uploads & offline sync
│   │   │   │   ├── alerts.py           # Warning trigger & broadcast dispatch
│   │   │   │   └── emergency.py        # Priority index calculation & route triage
│   │   ├── services/                   # Business logic layer
│   │   │   ├── weather_service.py      # Open-Meteo & IMD data fetcher with caching
│   │   │   ├── ml_service.py           # Model loading, feature vector creation, inference
│   │   │   ├── cv_service.py           # YOLO image classification & crack segmentation
│   │   │   ├── gis_service.py          # Spatial intersection, buffering, PostGIS queries
│   │   │   ├── priority_service.py     # MCDA emergency response prioritization algorithm
│   │   │   └── notification_service.py # Multi-channel notification & i18n formatter
│   │   └── workers/                    # Celery / Background tasks
│   │       ├── sync_worker.py          # Weather & sensor polling cron
│   │       └── cv_worker.py            # Async heavy image/video processing
│   ├── alembic/                        # Database migration scripts
│   │   ├── env.py
│   │   └── versions/
│   ├── requirements.txt                # Backend dependencies
│   ├── Dockerfile
│   └── tests/
│       ├── test_api.py
│       └── test_ml_inference.py
├── ai_ml/
│   ├── data/
│   │   ├── raw/                        # Raw landslide inventory & historical records
│   │   └── processed/                  # Feature matrices for model training
│   ├── notebooks/                      # Exploratory data analysis & model experiments
│   │   ├── 01_ner_landslide_eda.ipynb
│   │   ├── 02_model_training_xgb.ipynb
│   │   └── 03_cv_crack_detection.ipynb
│   ├── pipelines/
│   │   ├── feature_engineering.py      # Spatial & temporal feature generator
│   │   ├── train_hazard_model.py       # XGBoost / Random Forest training script
│   │   └── export_onnx.py              # Export models to lightweight ONNX format
│   ├── weights/                        # Pre-trained model weights (.pkl / .onnx / .pt)
│   │   ├── landslide_hazard_xgb.json
│   │   └── yolov8n_crack_debris.pt
│   └── inference/
│       ├── predict_hazard.py           # Fast inference wrapper with SHAP integration
│       └── detect_hazards_cv.py        # YOLO & OpenCV image evaluation logic
├── gis_pipeline/
│   ├── dem_processing/
│   │   ├── calculate_slope_aspect.py   # GDAL/Rasterio slope, aspect, curvature calc
│   │   └── calculate_twi.py            # Topographic Wetness Index pipeline
│   ├── road_network/
│   │   └── extract_ner_highways.py     # OSM Overpass fetcher for NH-10, NH-29, NH-6
│   └── data/
│       ├── dem_ner_sample.tif          # 30m SRTM sample DEM raster
│       └── ner_districts.geojson       # Administrative polygons for NER districts
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── manifest.json               # PWA Progressive Web App Manifest
│   │   ├── service-worker.js           # Workbox offline caching & background sync
│   │   └── icons/                      # PWA icons (192x192, 512x512)
│   ├── src/
│   │   ├── assets/
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── common/                 # Buttons, Cards, Modals, Badges, Tabs
│   │   │   ├── map/                    # GIS MapLibre/Leaflet layers & controls
│   │   │   │   ├── RiskMapViewer.tsx
│   │   │   │   ├── HazardLayerControl.tsx
│   │   │   │   ├── RoadVulnerabilityOverlay.tsx
│   │   │   │   └── IncidentPinMarker.tsx
│   │   │   ├── dashboard/              # Authority Command Center panels
│   │   │   │   ├── MetricCardsGrid.tsx
│   │   │   │   ├── WeatherTrendChart.tsx
│   │   │   │   ├── EmergencyPriorityTable.tsx
│   │   │   │   └── ExplainableAiModal.tsx
│   │   │   └── citizen/                # Citizen reporting UI
│   │   │       ├── CameraCaptureModal.tsx
│   │   │       ├── OfflineSyncStatusBadge.tsx
│   │   │       └── CrowdsourceReportForm.tsx
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useGeolocation.ts
│   │   │   ├── useOfflineQueue.ts
│   │   │   ├── useRealtimeAlerts.ts
│   │   │   └── useLanguage.ts
│   │   ├── locales/                    # Multilingual translation dictionaries (i18n)
│   │   │   ├── en.json
│   │   │   ├── hi.json
│   │   │   ├── as.json                 # Assamese
│   │   │   ├── bn.json                 # Bengali
│   │   │   └── mzo.json                # Mizo
│   │   ├── pages/                      # Application views
│   │   │   ├── DashboardPage.tsx       # Authority Command Center
│   │   │   ├── MapExplorerPage.tsx     # Fullscreen GIS Explorer
│   │   │   ├── CitizenReportPage.tsx   # Mobile-first reporting portal
│   │   │   ├── EmergencyTriagePage.tsx # Route & resource prioritization
│   │   │   └── AnalyticsPage.tsx       # Historical trends & model diagnostics
│   │   ├── services/                   # API clients & IndexedDB utilities
│   │   │   ├── apiClient.ts            # Axios / Fetch wrapper with auth headers
│   │   │   ├── indexedDb.ts            # Dexie.js offline queue configuration
│   │   │   └── webSocketService.ts     # Real-time WebSocket connection manager
│   │   ├── store/                      # Zustand state stores
│   │   │   ├── alertStore.ts
│   │   │   ├── mapStore.ts
│   │   │   └── authStore.ts
│   │   ├── App.tsx
│   │   ├── index.css                   # TailwindCSS entry
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml                  # Postgres/PostGIS + Redis + Backend + Frontend
└── README.md
```

---

## 5. Technology Stack & Key Dependencies

### Frontend
- **Framework**: React 18 with TypeScript & Vite (blazing fast HMR and optimized bundle)
- **Styling**: Tailwind CSS + Lucide Icons + Radix UI / Headless primitives
- **Interactive Mapping**: Leaflet & React-Leaflet (or MapLibre GL JS for vector hillshading)
- **Data Visualization**: Recharts (for antecedent rainfall curves, sensor moisture vs pore pressure)
- **Offline / PWA**: Workbox + Vite PWA Plugin + IndexedDB (`idb` / `dexie`)
- **State Management**: Zustand (lightweight, zero-boilerplate client state)
- **Internationalization (i18n)**: `i18next` + `react-i18next` (English, Hindi, Assamese, Bengali, Mizo, Manipuri, Khasi)

### Backend
- **Framework**: Python 3.11+ FastAPI (Async ASGI, OpenAPI documentation, high concurrency)
- **Database ORM**: SQLAlchemy 2.0 (Async) + GeoAlchemy2 (Spatial extensions)
- **Validation**: Pydantic v2
- **Real-Time Communication**: Native FastAPI WebSockets + Redis Pub/Sub
- **Background Tasks**: Celery with Redis broker (or FastAPI BackgroundTasks for MVP)
- **HTTP Client**: `httpx` (async client for weather APIs)

### AI / ML & Computer Vision
- **Tabular Modeling**: XGBoost, LightGBM, Scikit-learn (Landslide susceptibility & risk scoring)
- **Model Explainability**: SHAP (TreeExplainer for real-time feature attribution in alerts)
- **Computer Vision**: PyTorch, Ultralytics (YOLOv8-Nano for crack/debris detection), OpenCV (contour width analysis & edge filters)
- **Runtime**: ONNX Runtime (low-latency CPU/GPU execution)

### Geospatial & Database
- **Primary Database**: PostgreSQL 16 with PostGIS 3.4
- **Spatial Python Libraries**: GeoPandas, Shapely, PyProj, Rasterio, GDAL
- **Tile Serving**: Dynamic GeoJSON endpoints & MVT (Mapbox Vector Tiles) via PostGIS `ST_AsMVT`

---

## 6. Inter-Component Communication Architecture

| Source | Destination | Protocol / Mechanism | Payload / Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend PWA** | **FastAPI Backend** | HTTPS REST (`POST /api/v1/reports`) | Citizen hazard reports, multipart photo uploads, EXIF data |
| **PWA Service Worker** | **IndexedDB** | Local Web Storage API | Queuing reports and caching base GeoJSON tiles when disconnected |
| **FastAPI Backend** | **Frontend Clients** | WebSockets (`ws://.../ws/alerts`) | Real-time push of critical landslide alerts and newly verified incidents |
| **FastAPI Backend** | **PostGIS Database** | Async TCP (SQLAlchemy + GeoAlchemy2) | Spatial queries: `ST_Intersects`, `ST_DWithin`, `ST_Buffer` |
| **FastAPI Backend** | **External Weather** | HTTPS REST (`httpx`) | Fetching hourly precipitation and 7-day rainfall history |
| **Backend Service** | **AI/ML Engine** | In-Process Memory / ONNX Runtime | Passing normalized 14-feature vector $\rightarrow$ returning probability & SHAP |
| **Backend Worker** | **CV Engine** | Async Queue / Celery | Passing citizen image file path $\rightarrow$ returning detected bounding boxes |
| **Backend Service** | **Notification Svc** | Async HTTP / SMTP / SMS Hook | Sending SMS and WebPush payloads to subscribed district users |

---

## 7. Proposed REST API Endpoints

### Authentication & Users
- `POST /api/v1/auth/register` – Register citizen or district official account
- `POST /api/v1/auth/login` – Authenticate and issue JWT bearer token
- `GET /api/v1/auth/me` – Retrieve current user role (Citizen, Field Inspector, DDMA Official)

### Dynamic Weather & Sensors
- `GET /api/v1/weather/current?lat={lat}&lon={lon}` – Fetch live weather and antecedent rainfall
- `GET /api/v1/weather/forecast?lat={lat}&lon={lon}&days=3` – Fetch multi-day precipitation forecast
- `POST /api/v1/sensors/telemetry` – Ingest in-situ IoT pore-pressure and tilt data
- `GET /api/v1/sensors/{station_id}/history` – Retrieve historical sensor readings

### GIS & Spatial Layers
- `GET /api/v1/gis/risk-zones?district={id}` – Return GeoJSON polygons of active risk zones
- `GET /api/v1/gis/vulnerable-roads` – Return GeoJSON lines of roads overlaid with cut-slope risk
- `GET /api/v1/gis/critical-facilities` – Return hospitals, bridges, shelters within selected bbox
- `GET /api/v1/gis/elevation-profile?start_lat=..&end_lat=..` – Query elevation gradient along an arterial road

### AI/ML Predictions & Explainability
- `POST /api/v1/predict/point` – Compute instantaneous landslide susceptibility score for lat/lon
- `GET /api/v1/predict/district/{id}` – Get aggregated risk score breakdown for an administrative area
- `GET /api/v1/predict/explain/{zone_id}` – Fetch SHAP feature importance explaining why alert was issued

### Citizen & Field Incident Reporting
- `POST /api/v1/reports/` – Submit a new geo-tagged incident report with photo upload
- `POST /api/v1/reports/bulk-sync` – Synchronize an array of offline reports stored in client IndexedDB
- `GET /api/v1/reports/` – Query incident reports (filterable by status: pending, verified, resolved)
- `PATCH /api/v1/reports/{id}/verify` – Authority endpoint to manually confirm or escalate an incident

### Early Warning Alerts & Prioritization
- `GET /api/v1/alerts/active` – Retrieve currently active Red/Orange/Yellow warnings
- `POST /api/v1/alerts/broadcast` – Authority endpoint to dispatch emergency broadcast
- `GET /api/v1/emergency/priorities` – Query ranked list of high-risk sectors sorted by Emergency Index
- `GET /api/v1/emergency/evacuation-route?origin=..&destination=..` – Calculate safest detour avoiding critical zones

---

## 8. Real vs Mock Data Strategy for MVP

To ensure rapid, realistic development and testing while maintaining hackathon velocity, data sources are categorized into **Real** and **Simulated**:

```
+------------------------------------------------------------------------------------------+
|                                    REAL DATA STREAMS                                     |
+------------------------------------------------------------------------------------------+
| 1. Live & Forecast Precipitation:                                                        |
|    - Open-Meteo Weather API (Free, no-key, hyper-local 0.05-deg hourly rainfall for NER) |
|    - Computes Real Antecedent Precipitation Index (API-7 & API-3) for any lat/lon.       |
| 2. Terrain & Digital Elevation:                                                          |
|    - Real 30m SRTM / ALOS DEM GeoTIFF cutouts for high-risk NER pilot zones              |
|      (e.g., Gangtok-Sevoke NH-10 corridor, Guwahati-Shillong NH-6 corridor).            |
| 3. Infrastructure & Transport Topologies:                                                |
|    - Real OpenStreetMap (OSM) data fetched via Overpass API for roads, bridges,          |
|      villages, and hospitals in selected NER pilot districts.                            |
| 4. Historical Landslide Inventory:                                                       |
|    - NASA Global Landslide Catalog (GLC) & Geological Survey of India (GSI) records      |
|      filtered to coordinates in Assam, Meghalaya, and Sikkim for model training.         |
+------------------------------------------------------------------------------------------+
|                                  SYNTHETIC / MOCK FEEDS                                  |
+------------------------------------------------------------------------------------------+
| 1. In-Situ Geotechnical IoT Sensors:                                                     |
|    - Virtual telemetry generator producing realistic soil volumetric water content (VWC),|
|      vibrating-wire piezometer pore pressures (kPa), and biaxial tiltmeter angles (deg)   |
|      statistically correlated with rainfall events.                                      |
| 2. Crowdsourced Citizen Reports Seed Data:                                               |
|    - Curated dataset of ~50 geo-referenced NER road and hillside photographs featuring   |
|      tension cracks, rockfalls, and blocked roads to demonstrate instant CV triage.      |
| 3. SMS & Cell-Broadcast Gateway:                                                         |
|    - Mocked notification logger with UI simulation drawer and webhook integration        |
|      (ready to plug into Twilio / C-DAC CDAC Cap Gateway).                               |
+------------------------------------------------------------------------------------------+
```

---

## 9. AI/ML Susceptibility & Dynamic Risk Engine

### 9.1 Feature Engineering Matrix
Landslides result from the interplay of **static causal factors** (which make a slope inherently prone) and **dynamic triggering factors** (which push the slope past its shear strength threshold):

$$\text{Factor Vector } \mathbf{X} = [\mathbf{X}_{\text{static}}, \mathbf{X}_{\text{dynamic}}]$$

- **Static Geomorphic & Environmental Factors:**
  1. **Slope Gradient ($\theta$)**: Derived from DEM in degrees ($>35^\circ$ carries high hazard).
  2. **Slope Aspect**: Direction of slope face (influences monsoon moisture retention).
  3. **Curvature**: Planform and profile curvature (divergent vs. convergent slope hollows).
  4. **Topographic Wetness Index (TWI)**: $\ln(a / \tan \beta)$ representing hydrologic accumulation.
  5. **Lithology / Soil Type**: Fragile sedimentary/phyllite vs. crystalline granite.
  6. **Distance to Drainage / Streams**: Proximity to toe-erosion from raging hill streams.
  7. **Distance to Road Cuts**: Proximity to unreinforced human excavation ($<50\text{m}$ buffer).
  8. **Historical Landslide Frequency Index**: Kernel Density Estimation (KDE) from GSI catalog.

- **Dynamic Triggering Factors:**
  1. **Current 1-Hour Rainfall ($R_1$)** in mm.
  2. **Cumulative 24-Hour Rainfall ($R_{24}$)** in mm.
  3. **Antecedent Precipitation Index (API-7)**:
     $$\text{API}_t = \sum_{i=1}^{n} k^i \cdot R_{t-i} \quad (k \approx 0.84)$$
  4. **Soil Moisture / Volumetric Water Content (VWC)**: Percentage saturation from Open-Meteo soil models or in-situ sensors.
  5. **Seismic Co-Trigger Factor**: Peak Ground Acceleration (PGA) from recent regional seismic activity.

### 9.2 Machine Learning Pipeline
1. **Model Architecture**: Optimized Gradient Boosted Decision Trees (**XGBoost** / **LightGBM**) trained on historical positive landslide occurrences and balanced non-landslide background points.
2. **Output**: Calibrated probability $P(\text{Landslide}) \in [0.0, 1.0]$.
3. **Dynamic Risk Categorization**:
   - **Low (Green)**: $P < 0.30$
   - **Moderate (Yellow)**: $0.30 \le P < 0.60$
   - **High (Orange)**: $0.60 \le P < 0.80$
   - **Critical / Severe (Red)**: $P \ge 0.80$
4. **Real-Time Explainability via SHAP**:
   - For every high/critical alert, TreeSHAP extracts the top 3 contributing factors (e.g., `"72h Antecedent Rain (52%) + Slope Gradient 41° (31%) + High TWI (17%)"`), displayed on the administrative dashboard so disaster managers understand **why** an alert fired.

---

## 10. Computer Vision Architecture (Citizen Ground Intelligence)

```
[Citizen Upload: Photo of Hillside / Road]
                   |
                   v
    +------------------------------+
    | 1. Image Integrity & EXIF    |
    | - Extract Lat/Lon & Timestamp|
    | - Check blur & resolution    |
    +--------------+---------------+
                   |
                   v
    +------------------------------+
    | 2. YOLOv8-Nano Hazard Detect |
    | Classes:                     |
    | [ground_crack, rockfall,     |
    |  debris_flow, road_blocked]  |
    +--------------+---------------+
                   |
                   v
    +------------------------------+
    | 3. OpenCV Geometric Analysis |
    | - Crack width estimation     |
    | - Road area obstruction %    |
    +--------------+---------------+
                   |
                   v
    +--------------------------------------------------------+
    | 4. Verification & Dynamic Calibration                  |
    | - If road_blocked detected -> Auto-flag Priority Tier 1|
    | - Update PostGIS incident layer                        |
    | - Recalibrate local sector risk score upwards          |
    +--------------------------------------------------------+
```

- **Model**: Custom-trained or fine-tuned **YOLOv8-Nano** (~3.2M parameters), lightweight enough to run inference on backend CPU under 120ms per photo.
- **Contour & Texture Analysis**: OpenCV Canny edge and morphological closing to estimate structural fissure widths and distinguish wet mud flows from asphalt.

---

## 11. Geospatial & GIS Architecture

- **Projection System**: 
  - Web & API exchange: **EPSG:4326 (WGS 84)**.
  - Spatial metric calculations (distances, buffer radius in meters): **EPSG:32646 (UTM Zone 46N)** covering NER.
- **Spatial Indexing**: 
  - PostGIS **GiST** (Generalized Search Tree) indexes on all geometric columns (`geom`).
  - Road network cut-slope vulnerability calculated using spatial buffers:
    ```sql
    ST_DWithin(road.geom, risk_zone.geom, 50.0) -- 50m road cut buffer
    ```
- **Tile Rendering**:
  - Vector layers: Dynamic GeoJSON with spatial bounding-box (`bbox`) queries.
  - Base terrain: Satellite basemap with MapLibre 3D terrain mesh generated from SRTM DEM.

---

## 12. Offline-First Reporting & Synchronization Strategy

In remote hill regions of Sikkim, Arunachal Pradesh, and Mizoram, internet connectivity is intermittent or absent. The system employs an **Offline-First PWA Architecture**:

```
[Field Officer takes photo in zero-connectivity gorge]
                   |
                   v
    +------------------------------------------+
    | Client PWA (Browser / Mobile)            |
    | 1. Geolocation retrieved via device GPS  |
    | 2. Image converted to optimized WebP     |
    | 3. Payload stored in IndexedDB           |
    | 4. Sync status marked as 'PENDING_OFFLINE'
    +------------------------------------------+
                   |
                   | (User returns to cell coverage / Wi-Fi)
                   v
    +------------------------------------------+
    | Service Worker: Background Sync API      |
    | 1. Catches 'sync' event / online event   |
    | 2. Reads queued reports from IndexedDB   |
    | 3. POST to /api/v1/reports/bulk-sync     |
    | 4. Idempotent UUID verification on server|
    | 5. Updates local UI badge to 'SYNCED'    |
    +------------------------------------------+
```

- **Conflict Handling**: Every report is assigned a client-generated UUIDv4. Duplicate submissions are idempotently discarded by the backend.
- **Offline Maps**: Emergency contact directories and low-resolution vector boundary tiles are pre-cached in CacheStorage via Workbox.

---

## 13. Emergency Response Prioritization Algorithm

Disaster authorities cannot inspect every slope simultaneously. The system uses a **Multi-Criteria Decision Analysis (MCDA)** algorithm to rank sectors and roads in order of emergency response urgency:

$$\text{Priority Score (PS)} = \left( w_1 \cdot P_{\text{hazard}} \right) \times \left( w_2 \cdot C_{\text{road}} + w_3 \cdot D_{\text{pop}} + w_4 \cdot I_{\text{critical}} \right) \times \left( 1 + \alpha \cdot \Delta R_{\text{trend}} \right)$$

### Parameter Definitions & Normalized Weights:
- $P_{\text{hazard}} \in [0.0, 1.0]$: Model-predicted landslide susceptibility.
- $C_{\text{road}} \in [1, 5]$: **Road Criticality Index**:
  - 5: Arterial National Highway (Lifeline, e.g. NH-10 / NH-29; no alternate route).
  - 3: State Highway / District Arterial.
  - 1: Local Village road.
- $D_{\text{pop}} \in [1, 5]$: **Vulnerable Settlement Density** within 500m downslope buffer.
- $I_{\text{critical}} \in [1, 5]$: **Critical Infrastructure Exposure** (presence of hospitals, relief shelters, bridges, power substations).
- $\Delta R_{\text{trend}}$: 6-hour rainfall rate of change ($\text{mm/hr}$ acceleration).

### Operational Tiers:
| Priority Tier | Score Range | Mandatory Action Protocol |
| :--- | :--- | :--- |
| **Tier 1 (Critical)** | $\text{PS} \ge 80$ | Immediate NDRF/SDRF prepositioning; close road to heavy traffic; village evacuation sirens. |
| **Tier 2 (High)** | $50 \le \text{PS} < 80$ | District administration advisory; road patrol dispatched; JCB/earthmovers on standby. |
| **Tier 3 (Moderate)** | $25 \le \text{PS} < 50$ | Continuous automated sensor monitoring; public travel advisories posted online. |
| **Tier 4 (Low)** | $\text{PS} < 25$ | Routine baseline surveillance. |

---

## 14. Phased Implementation Roadmap

```
+-----------------------------------------------------------------------------------------+
| PHASE 1: FOUNDATION, GIS PIPELINES & DATA SCHEMAS (Days 1 - 2)                           |
| - Setup Monorepo structure, Docker Compose (PostgreSQL 16 + PostGIS, Redis).            |
| - Ingest NER pilot DEM rasters, extract slope/aspect/TWI, load OSM road layers.          |
| - Build Open-Meteo real-time & antecedent precipitation ingestion service.              |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| PHASE 2: AI/ML & COMPUTER VISION ENGINE (Days 3 - 4)                                     |
| - Construct feature engineering pipeline (static terrain + dynamic precipitation).      |
| - Train and serialize XGBoost Landslide Susceptibility model with SHAP explanations.     |
| - Implement YOLOv8/OpenCV image evaluation service for road blockages & crack triage.   |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| PHASE 3: BACKEND API GATEWAY & EMERGENCY LOGIC (Days 5 - 6)                              |
| - Develop FastAPI REST endpoints (GIS, Predictions, Reports, Alerts).                   |
| - Implement Emergency Prioritization MCDA ranking algorithm.                            |
| - Implement WebSocket real-time alert broadcaster & offline bulk-sync endpoint.          |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| PHASE 4: COMMAND & CONTROL DASHBOARD & CITIZEN PWA (Days 7 - 9)                          |
| - Build interactive GIS Explorer (MapLibre/Leaflet with dynamic risk zones & roads).     |
| - Create Admin Command Dashboard with Recharts sensor/rainfall graphs & SHAP breakdown.  |
| - Build mobile-responsive Citizen PWA with camera capture, IndexedDB queue & i18n.      |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| PHASE 5: HARDENING, SCENARIO SIMULATION & DEMO POLISH (Days 10 - 11)                     |
| - Implement Monsoon Cloudburst Scenario (simulated extreme rain spike across NH-10).     |
| - Validate offline-to-online report synchronization end-to-end.                          |
| - Create executive demo scripts, pitch deck diagrams, and user role test flows.         |
+-----------------------------------------------------------------------------------------+
```

---

## 15. Risk Assessment & Mitigation Matrix

| Identified Technical Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Spotty 4G/2G connectivity in remote NER valleys** | High | Service Worker caching, IndexedDB offline queuing, client-side WebP image compression, and low-payload JSON delta sync. |
| **High false-positive alarm rate from weather models** | High | Combine rainfall thresholds with static physical slope stability (slope $>30^\circ$, high TWI, cut-slope proximity); apply antecedent multi-day decay ($API_7$). |
| **Heavy GIS computation causing high API latency** | Medium | Pre-compute static terrain factors into PostGIS vector grid; dynamic API only evaluates lightweight XGBoost inference using pre-computed cell attributes. |
| **Spam / duplicate crowdsourced citizen reports** | Medium | Automated spatio-temporal clustering (DBSCAN over 50m / 2hr window) + CV verification confidence scoring before escalating to emergency tier. |

---

## 16. Verification & Test Suite

The system includes a comprehensive automated test suite covering ML inference, Computer Vision contours, MCDA emergency prioritization, GIS calculations, and full end-to-end integration:

```bash
# Run all unit and integration tests (33 passed)
.venv\Scripts\pytest backend\tests -v
```

---

## 17. Live Execution & Hackathon Demonstration Guide

### Quick Start Commands

```bash
# 1. Launch the unified ASGI Backend & Built React PWA
.venv\Scripts\python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# 2. Access the Application in your Browser:
#    - Web Command Center & Citizen PWA: http://localhost:8000/
#    - Interactive Swagger API Docs:      http://localhost:8000/docs
#    - System Health Probe:               http://localhost:8000/health

# 3. Trigger the Autonomous Extreme Monsoon Cloudburst Simulation:
.venv\Scripts\python scripts/simulate_cloudburst.py
```

### Live Demonstration Walkthrough for Judges:
1. **GIS Command Dashboard (`/`)**:
   - Live state of NER pilot corridors: NH-10 (Sikkim), NH-6 (Assam/Meghalaya), and NH-29 (Nagaland).
   - Dynamic pie charts of risk zones, in-situ sensor telemetry trends, and critical alert tickers.
2. **Interactive Map Explorer (`/map`)**:
   - Leaflet satellite/terrain view with color-coded risk polygons (Green / Yellow / Orange / Red).
   - Real-time road segment clearance statuses (OPEN, RESTRICTED, BLOCKED).
   - Interactive popups with 1-click **Explainable AI (SHAP)** factor attribution breakdown.
3. **Emergency Triage & Mountain Detour Routing (`/triage`)**:
   - Multi-Criteria Decision Analysis (MCDA) ranking zones by urgency score.
   - Dynamic mountain bypass calculation (e.g. NH-10 Teesta gorge blocked $\rightarrow$ Pakyong-Lava alternate bypass activated).
   - 1-Click NDRF / BRO Dispatch Order Modal with automatic mobilization tracking.
4. **Citizen & Field Worker PWA (`/report`)**:
   - Offline-first report capture with photo upload.
   - Built-in OpenCV computer vision hazard detection (crack detection & debris flow classification).
   - IndexedDB offline caching with automatic batch synchronization when back online.
5. **Multilingual Inclusivity**:
   - 1-click switcher in the top navigation bar supporting English, Hindi, Assamese, Bengali, and Mizo.

