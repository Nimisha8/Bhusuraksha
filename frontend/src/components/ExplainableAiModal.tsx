import React from "react";
import { X, Cpu, Info, ShieldCheck, AlertCircle } from "lucide-react";
import { PredictionPointResult } from "../services/api";

interface ExplainableAiModalProps {
  prediction: PredictionPointResult | null;
  zoneName?: string;
  corridorName?: string;
  onClose: () => void;
}

export const ExplainableAiModal: React.FC<ExplainableAiModalProps> = ({
  prediction,
  zoneName,
  corridorName,
  onClose
}) => {
  if (!prediction) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Explainable AI (XAI) Factor Attribution
              </h3>
              <p className="text-xs text-slate-400">
                {zoneName || "Queried Slope Sector"} • {corridorName || "North Eastern Region"}
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

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Top Score Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Predicted Landslide Risk
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-100">
                  {prediction.risk_score_100}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span 
                  className={`text-xs font-bold px-2 py-0.5 rounded ml-2 ${
                    prediction.risk_tier === "CRITICAL"
                      ? "bg-red-950 text-red-400 border border-red-800"
                      : prediction.risk_tier === "HIGH"
                      ? "bg-orange-950 text-orange-400 border border-orange-800"
                      : prediction.risk_tier === "MODERATE"
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  }`}
                >
                  {prediction.risk_tier}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Failure Probability</span>
              <span className="text-lg font-bold text-amber-400">
                {(prediction.landslide_probability * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Contributing Drivers Bars */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                Key Triggering Drivers (TreeSHAP Decomposition)
              </span>
              <span className="text-[10px] text-slate-400">Relative Influence</span>
            </div>

            <div className="space-y-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
              {prediction.shap_top_drivers.map((driver, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{driver.factor_name}</span>
                    <span className="text-amber-400 font-bold">{driver.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${driver.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    {driver.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Guidance */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Authority Action Guidance
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {prediction.recommended_action}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/60 px-6 py-3 border-t border-slate-700/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
