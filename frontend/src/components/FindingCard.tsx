import React, { useState } from 'react';
import type { Finding, SeverityLevel, ActionStatus } from '../types/vision';
import {
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Eye,
  Brain,
  Lightbulb,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  sceneType: string;
  mediaId?: string;
  onExplain: (finding: Finding) => void;
  onActionUpdate: (findingId: string, action: ActionStatus) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; badgeClass: string; borderClass: string; iconClass: string }> = {
  critical: {
    label: 'Critical Hazard',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    borderClass: 'border-rose-500/40 hover:border-rose-500/70',
    iconClass: 'text-rose-400',
  },
  high: {
    label: 'High Severity',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-500/40 hover:border-amber-500/70',
    iconClass: 'text-amber-400',
  },
  medium: {
    label: 'Medium Attention',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderClass: 'border-cyan-500/40 hover:border-cyan-500/70',
    iconClass: 'text-cyan-400',
  },
  low: {
    label: 'Low / Informational',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderClass: 'border-emerald-500/40 hover:border-emerald-500/70',
    iconClass: 'text-emerald-400',
  },
};

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  sceneType,
  onExplain,
  onActionUpdate,
  isSelected,
  onSelect
}) => {
  const [updatingAction, setUpdatingAction] = useState<boolean>(false);
  const sevConfig = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.medium;
  const currentAction = finding.action_status || 'pending';

  const handleAction = async (action: ActionStatus) => {
    setUpdatingAction(true);
    try {
      await onActionUpdate(finding.id, action);
    } finally {
      setUpdatingAction(false);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl glass-card p-5 space-y-4 cursor-pointer transition-all duration-200 ${
        sevConfig.borderClass
      } ${isSelected ? 'ring-2 ring-brand-400 shadow-glow' : ''}`}
    >
      
      {/* Top Header: Title & Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5 ${sevConfig.iconClass}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 leading-snug">{finding.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${sevConfig.badgeClass}`}>
                {sevConfig.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 text-[10px] font-mono border border-slate-700/50">
                Confidence: <strong className="text-slate-200">{finding.confidence.toUpperCase()}</strong>
              </span>
              {Array.isArray(finding.bounding_box) && finding.bounding_box.length === 4 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 text-[10px] font-mono border border-brand-500/20 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  <span>Box Grounded</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Explainability Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExplain(finding);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 border border-slate-700/60 hover:border-brand-500/40 text-[11px] font-medium transition shrink-0"
          title="Ask VisionIQ: Why did you flag this?"
        >
          <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden sm:inline">Why flagged?</span>
        </button>
      </div>

      {/* Structured Triad: Observation -> Interpretation -> Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
        
        {/* 1. Literal Observation */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px] uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" />
            <span>1. Literal Observation</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {finding.observation}
          </p>
        </div>

        {/* 2. Hedged Interpretation */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-violet-400 font-semibold text-[11px] uppercase tracking-wider">
            <Brain className="w-3.5 h-3.5" />
            <span>2. Hedged Interpretation</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {finding.interpretation}
          </p>
        </div>

        {/* 3. Concrete Recommendation */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>3. Action Recommendation</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {finding.recommendation}
          </p>
        </div>

      </div>

      {/* Human-in-the-loop Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Auditor Status:</span>
          {currentAction === 'confirmed' && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] flex items-center gap-1 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> Confirmed
            </span>
          )}
          {currentAction === 'dismissed' && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-semibold text-[10px] flex items-center gap-1 border border-slate-700">
              <XCircle className="w-3 h-3" /> Dismissed
            </span>
          )}
          {currentAction === 'escalated' && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-semibold text-[10px] flex items-center gap-1 border border-rose-500/30">
              <ArrowUpRight className="w-3 h-3" /> Escalated
            </span>
          )}
          {currentAction === 'pending' && (
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-500 text-[10px] font-mono">
              Pending Review
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleAction('confirmed')}
            disabled={updatingAction || currentAction === 'confirmed'}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
              currentAction === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirm</span>
          </button>

          <button
            onClick={() => handleAction('dismissed')}
            disabled={updatingAction || currentAction === 'dismissed'}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
              currentAction === 'dismissed'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Dismiss</span>
          </button>

          <button
            onClick={() => handleAction('escalated')}
            disabled={updatingAction || currentAction === 'escalated'}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
              currentAction === 'escalated'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800'
            }`}
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>Escalate</span>
          </button>
        </div>
      </div>

    </div>
  );
};
