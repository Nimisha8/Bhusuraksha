import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  MapPin, 
  UploadCloud, 
  CheckCircle2, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  Eye, 
  Sparkles,
  Info
} from "lucide-react";
import { 
  submitCitizenReport, 
  fetchCitizenReports, 
  CitizenReportItem 
} from "../services/api";
import { 
  queueOfflineReport, 
  getQueuedReports, 
  getQueuedCount, 
  syncAllQueuedReports, 
  QueuedReport 
} from "../services/indexedDb";
import { LanguageKey, DICTIONARY } from "../locales/i18n";

interface CitizenReportPageProps {
  currentLang: LanguageKey;
  isOnline: boolean;
  onQueueUpdated: () => void;
}

export const CitizenReportPage: React.FC<CitizenReportPageProps> = ({
  currentLang,
  isOnline,
  onQueueUpdated
}) => {
  const t = DICTIONARY[currentLang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [lat, setLat] = useState<number>(27.2412);
  const [lon, setLon] = useState<number>(88.5124);
  const [locationName, setLocationName] = useState<string>("32nd Mile / Singtam Slope, NH-10");
  const [state, setState] = useState<string>("Sikkim");
  const [district, setDistrict] = useState<string>("Pakyong");
  const [hazardType, setHazardType] = useState<string>("CRACK");
  const [severity, setSeverity] = useState<string>("HIGH");
  const [description, setDescription] = useState<string>("Tension fissure observed running across retaining wall above the carriageway.");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<CitizenReportItem | null>(null);
  const [queuedItems, setQueuedItems] = useState<QueuedReport[]>([]);
  const [recentReports, setRecentReports] = useState<CitizenReportItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Load offline queued reports and recent reports on mount
  const refreshQueuedList = async () => {
    const list = await getQueuedReports();
    setQueuedItems(list);
    onQueueUpdated();
  };

  const loadRecentReports = async () => {
    try {
      const data = await fetchCitizenReports();
      setRecentReports(data);
    } catch (e) {
      console.warn("Could not load recent reports (may be offline):", e);
    }
  };

  useEffect(() => {
    refreshQueuedList();
    loadRecentReports();
  }, []);

  // Geolocation auto-detect
  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(Number(position.coords.latitude.toFixed(4)));
          setLon(Number(position.coords.longitude.toFixed(4)));
          setLocationName(`Current GPS Pin (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)})`);
        },
        (error) => {
          console.warn("GPS lookup denied or unavailable. Using default NER coordinates.", error);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  };

  // Photo change handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const clientUuid = `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Check if offline or user prefers offline queuing
    if (!navigator.onLine) {
      // Save directly to IndexedDB
      await queueOfflineReport({
        client_uuid: clientUuid,
        latitude: lat,
        longitude: lon,
        location_name: locationName,
        state,
        district,
        hazard_type: hazardType,
        severity,
        description,
        image_data_base64: photoPreview || undefined,
        offline_created_timestamp: Date.now()
      });
      await refreshQueuedList();
      alert("No cellular network detected. Report has been safely encrypted and queued in local IndexedDB. It will automatically transmit once connected.");
      setSubmitting(false);
      return;
    }

    // Submit online via multipart form data
    const formData = new FormData();
    formData.append("latitude", lat.toString());
    formData.append("longitude", lon.toString());
    formData.append("hazard_type", hazardType);
    formData.append("severity", severity);
    formData.append("location_name", locationName);
    formData.append("state", state);
    formData.append("district", district);
    formData.append("description", description);
    formData.append("client_uuid", clientUuid);
    if (selectedPhoto) {
      formData.append("photo", selectedPhoto);
    }

    try {
      const res = await submitCitizenReport(formData);
      setLastSubmissionResult(res);
      await loadRecentReports();
    } catch (err) {
      console.warn("API submission error, saving to offline IndexedDB fallback:", err);
      await queueOfflineReport({
        client_uuid: clientUuid,
        latitude: lat,
        longitude: lon,
        location_name: locationName,
        state,
        district,
        hazard_type: hazardType,
        severity,
        description,
        image_data_base64: photoPreview || undefined,
        offline_created_timestamp: Date.now()
      });
      await refreshQueuedList();
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    const res = await syncAllQueuedReports();
    await refreshQueuedList();
    await loadRecentReports();
    setSyncing(false);
    alert(`Offline Sync Complete: ${res.synced} report(s) transmitted to emergency center.`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-amber-400" />
            Citizen & Field Ground Intelligence Portal (PWA)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture geo-tagged tension cracks, slope movement, debris flows, and road cut failures even in zero-network valleys.
          </p>
        </div>

        {queuedItems.length > 0 && (
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync {queuedItems.length} Offline Report(s)
          </button>
        )}
      </div>

      {/* Main Submission Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location & GPS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Geo-Tagged Coordinates
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Auto-Detect GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  placeholder="Latitude"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                  required
                />
                <input
                  type="number"
                  step="0.0001"
                  value={lon}
                  onChange={(e) => setLon(parseFloat(e.target.value))}
                  placeholder="Longitude"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Location Description & State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Location Hint / Highway Mile
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="Sikkim">Sikkim</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Assam">Assam</option>
                  <option value="Arunachal Pradesh">Arunachal</option>
                  <option value="Mizoram">Mizoram</option>
                </select>
              </div>
            </div>

            {/* Hazard Type & Severity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Observed Hazard Category
                </label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="CRACK">Ground / Tension Crack in Slope</option>
                  <option value="ROCKFALL">Rockfall / Falling Boulders</option>
                  <option value="DEBRIS_FLOW">Active Mud & Debris Flow</option>
                  <option value="BLOCKED_ROAD">Blocked Carriageway / Cut Failure</option>
                  <option value="LEANING_TREE">Tilting Retaining Wall / Poles</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Apparent Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="LOW">Low (Minor trickle / hair crack)</option>
                  <option value="MEDIUM">Medium (Persistent fissure)</option>
                  <option value="HIGH">High (Active slope creep)</option>
                  <option value="CRITICAL">Critical (Imminent slide / severed road)</option>
                </select>
              </div>
            </div>

            {/* Field Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Field Observation Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe crack length, mud accumulation, or road lane blockage..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            {/* Camera / Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Field Photograph (Triggers Instant Computer Vision Analysis)</span>
                {photoPreview && (
                  <span className="text-[10px] text-emerald-400 font-bold">Photo Attached</span>
                )}
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 bg-slate-950/60 p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center transition-colors group"
              >
                {photoPreview ? (
                  <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-lg">
                    <img src={photoPreview} alt="Preview" className="h-full object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-white">
                      Click to retake / change photo
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-amber-400 mx-auto transition-colors" />
                    <p className="text-xs font-bold text-slate-200">Tap to Capture Photo or Browse Device</p>
                    <p className="text-[10px] text-slate-400">Works offline via WebP image compressor</p>
                  </div>
                )}
              </div>
            </div>

            {/* Offline Notification */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t.offlineQueueNotice}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  Running Computer Vision & Ingestion...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-black" />
                  {t.submitReport}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Instant CV Triage Feedback & Queued Reports */}
        <div className="space-y-4">
          {/* Last Submission CV Result */}
          {lastSubmissionResult && (
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Instant Computer Vision Assessment</span>
              </div>

              {lastSubmissionResult.image_url && (
                <img 
                  src={lastSubmissionResult.image_url} 
                  alt="Hazard report" 
                  className="w-full h-36 object-cover rounded-xl border border-slate-800"
                />
              )}

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Verification Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {lastSubmissionResult.cv_verified}
                  </span>
                </div>
                {lastSubmissionResult.cv_detected_tags && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Detected Hazards</span>
                    <span className="font-mono text-amber-400 font-bold text-[11px]">
                      {lastSubmissionResult.cv_detected_tags}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Inferred Severity</span>
                  <span className="font-bold text-red-400">{lastSubmissionResult.severity}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Report logged into PostGIS spatial layers and emergency prioritization queue.
              </p>
            </div>
          )}

          {/* Offline Queue Box */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                Local IndexedDB Queue
              </h3>
              <span className="text-[10px] font-mono bg-slate-950 text-amber-400 px-2 py-0.5 rounded border border-slate-800">
                {queuedItems.length} Pending
              </span>
            </div>

            {queuedItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 italic">
                All reports are synchronized with the central database.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {queuedItems.map(item => (
                  <div key={item.client_uuid} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-300">
                      <span>{item.hazard_type}</span>
                      <span className="text-[10px] text-amber-400">{item.severity}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{item.location_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
