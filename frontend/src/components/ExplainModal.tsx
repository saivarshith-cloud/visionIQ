import React from 'react';
import type { ExplainFindingResponse, Finding } from '../types/vision';
import { X, HelpCircle, Eye, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: Finding | null;
  explanation: ExplainFindingResponse | null;
  isLoading: boolean;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  finding,
  explanation,
  isLoading
}) => {
  if (!isOpen || !finding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-slate-700/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Grounded Explainability Engine
              </div>
              <h3 className="text-base font-bold text-white">
                Why was this flagged?
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">
              Re-evaluating visual evidence and synthesizing grounded explainability rationale...
            </p>
          </div>
        ) : explanation ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            
            {/* Finding Header Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">{finding.title}</div>
                <div className="text-[11px] text-slate-400">{finding.observation}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] font-mono font-bold uppercase text-brand-300">
                {finding.severity}
              </span>
            </div>

            {/* Grounded Explanation Narrative */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auditor's Evidence-Based Reasoning</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {explanation.grounded_explanation}
              </p>
            </div>

            {/* Visual Cues & Risk Factors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Key Visual Cues</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                  {explanation.visual_cues.map((cue, idx) => (
                    <li key={idx}>{cue}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Identified Risk Factors</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                  {explanation.risk_factors.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Confidence Rationale */}
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{explanation.confidence_rationale}</span>
            </div>

          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
          >
            Close Explanation
          </button>
        </div>

      </div>
    </div>
  );
};
