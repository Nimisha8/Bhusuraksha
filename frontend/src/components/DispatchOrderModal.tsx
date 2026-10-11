import React, { useState } from "react";
import { X, Truck, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import { issueDispatchOrder } from "../services/api";

interface DispatchOrderModalProps {
  zoneCode: string;
  zoneName: string;
  corridorName?: string;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const DispatchOrderModal: React.FC<DispatchOrderModalProps> = ({
  zoneCode,
  zoneName,
  corridorName,
  onClose,
  onSuccess
}) => {
  const [unitType, setUnitType] = useState("NDRF_PLATOON");
  const [destinationSector, setDestinationSector] = useState(zoneName);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await issueDispatchOrder({
        zone_code: zoneCode,
        unit_type: unitType,
        destination_sector: destinationSector
      });
      setConfirmedOrderId(res.order_id);
      onSuccess(res.order_id);
    } catch (err) {
      console.error("Dispatch order failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Issue Emergency Mobilization Order
              </h3>
              <p className="text-xs text-slate-400">
                {zoneCode} • {corridorName || "NER Corridor"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {confirmedOrderId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">
                Dispatch Order Authorized & Dispatched
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Order ID: <span className="font-mono text-amber-400 font-bold">{confirmedOrderId}</span>
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
              Units have received coordinates via radio dispatch. Target ETA: <span className="text-emerald-400 font-bold">45 Minutes</span>.
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Return to Command Center
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Sector / Settlement
              </label>
              <input
                type="text"
                value={destinationSector}
                onChange={(e) => setDestinationSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deployment Resource Unit
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
              >
                <option value="NDRF_PLATOON">1x NDRF Search & Rescue Platoon (35 personnel)</option>
                <option value="BRO_EARTHMOVER">Border Roads (BRO) Heavy Bulldozer & Excavator</option>
                <option value="TRAFFIC_POLICE">State Highway Traffic Police Diversion Squad</option>
                <option value="MEDICAL_AMBULANCE">Emergency Medical & Triage Mobile Unit</option>
              </select>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-start gap-2 text-xs text-amber-300/90">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Authorizing this dispatch updates the state disaster coordination dashboard and sends alert signals to district quick-response depots.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/20"
              >
                {submitting ? "Transmitting Order..." : "Authorize Mobilization"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
