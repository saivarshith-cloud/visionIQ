import React from 'react';
import type { VisionIQAnalysisResponse, Finding, ActionStatus, OverallStatus } from '../types/vision';
import { FindingCard } from './FindingCard';
import { AskVisionIQ } from './AskVisionIQ';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Workflow,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

interface ResultsDashboardProps {
  analysis: VisionIQAnalysisResponse;
  onExplainFinding: (finding: Finding) => void;
  onActionUpdate: (findingId: string, action: ActionStatus) => void;
  selectedFindingId?: string | null;
  onSelectFinding?: (id: string | null) => void;
  sampleId?: string;
  uploadedFile?: File;
}

const STATUS_BADGES: Record<OverallStatus, { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }> = {
  high_risk: {
    label: 'HIGH RISK / CRITICAL HAZARD',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-rose',
    icon: AlertOctagon,
  },
  attention_required: {
    label: 'ATTENTION REQUIRED',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-amber',
    icon: AlertTriangle,
  },
  normal: {
    label: 'ALL SYSTEMS NORMAL / NOMINAL',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-emerald',
    icon: CheckCircle2,
  },
};

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis,
  onExplainFinding,
  onActionUpdate,
  selectedFindingId,
  onSelectFinding,
  sampleId,
  uploadedFile
}) => {
  const statusInfo = STATUS_BADGES[analysis.overall_status] || STATUS_BADGES.normal;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Scene Badge & Overall Risk Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-slate-800">
        
        {/* Scene Identification */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Classified Domain
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-white capitalize">
                {analysis.scene.type}
              </span>
              {analysis.scene.sub_category && (
                <span className="text-xs text-slate-400 font-mono">
                  ({analysis.scene.sub_category})
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                {analysis.scene.confidence.toUpperCase()} CONFIDENCE
              </span>
            </div>
          </div>
        </div>

        {/* Overall Status Badge */}
        <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 ${statusInfo.badgeClass}`}>
          <StatusIcon className="w-5 h-5 animate-pulse" />
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">
              Overall Status
            </div>
            <div className="text-xs font-black tracking-wide">
              {statusInfo.label}
            </div>
          </div>
        </div>

      </div>

      {/* Executive Summary Card */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
          <FileText className="w-4 h-4" />
          <span>Executive Intelligence Summary</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
          {analysis.executive_summary}
        </p>
      </div>

      {/* Dynamic Execution Plan Steps */}
      {analysis.analysis_plan && analysis.analysis_plan.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Workflow className="w-3.5 h-3.5 text-brand-400" />
            <span>Reasoning & Validation Plan Executed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {analysis.analysis_plan.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-slate-300 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Grounded Findings</h2>
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold font-mono border border-brand-500/30">
              {analysis.findings.length}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Click finding to highlight bounding box
          </div>
        </div>

        {analysis.findings.length === 0 ? (
          <div className="p-8 rounded-2xl glass-card text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <p className="text-sm font-medium">No visual hazards or anomalies detected.</p>
            <p className="text-xs text-slate-500">Scene conforms to expected baseline criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analysis.findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                sceneType={analysis.scene.type}
                mediaId={analysis.filename}
                onExplain={onExplainFinding}
                onActionUpdate={onActionUpdate}
                isSelected={selectedFindingId === finding.id}
                onSelect={() =>
                  onSelectFinding?.(selectedFindingId === finding.id ? null : finding.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Follow-up Question Box: Ask VisionIQ */}
      <AskVisionIQ
        mediaUrl={analysis.media_url}
        mediaId={analysis.media_id || analysis.filename}
        sampleId={sampleId}
        uploadedFile={uploadedFile}
        sceneType={analysis.scene.type}
      />

    </div>
  );
};
