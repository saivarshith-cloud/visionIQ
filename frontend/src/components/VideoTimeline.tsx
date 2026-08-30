import React, { useState } from 'react';
import type { TimelineKeyframe, OverallStatus } from '../types/vision';
import { API_BASE_URL } from '../config';
import { Film, Clock, AlertTriangle, CheckCircle2, AlertOctagon, ChevronRight } from 'lucide-react';

interface VideoTimelineProps {
  timeline: TimelineKeyframe[];
  onSelectFrame?: (frame: TimelineKeyframe) => void;
  selectedFrameIndex?: number;
}

const STATUS_ICONS: Record<OverallStatus, { color: string; border: string; bg: string }> = {
  high_risk: { color: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/20' },
  attention_required: { color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/20' },
  normal: { color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/20' },
};

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  timeline,
  onSelectFrame,
  selectedFrameIndex
}) => {
  const [activeFrame, setActiveFrame] = useState<TimelineKeyframe | null>(
    timeline.length > 0 ? timeline[0] : null
  );

  const handleFrameClick = (frame: TimelineKeyframe) => {
    setActiveFrame(frame);
    onSelectFrame?.(frame);
  };

  return (
    <div className="space-y-4 glass-panel rounded-2xl p-5 border border-slate-800">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-bold text-white">FFmpeg Sampled Video Timeline</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
          {timeline.length} Keyframes Processed
        </span>
      </div>

      {/* Horizontal Scrollable Timeline Scrubber */}
      <div className="relative pt-4 pb-2 overflow-x-auto">
        {/* Timeline Connector Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-6" />

        <div className="flex items-center gap-3 min-w-max px-2">
          {timeline.map((frame, idx) => {
            const isSelected = activeFrame?.frame_index === frame.frame_index;
            const style = STATUS_ICONS[frame.status] || STATUS_ICONS.normal;
            const thumbUrl = `${API_BASE_URL}${frame.thumbnail_url}`;

            return (
              <div
                key={frame.frame_index}
                onClick={() => handleFrameClick(frame)}
                className={`relative flex flex-col items-center cursor-pointer group transition-all ${
                  isSelected ? 'scale-105' : 'hover:scale-102 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Timestamp Pill */}
                <div className="mb-2 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 group-hover:text-brand-300 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{frame.timestamp_str}</span>
                </div>

                {/* Keyframe Thumbnail */}
                <div
                  className={`relative w-24 h-16 rounded-lg overflow-hidden bg-slate-950 border-2 transition-all ${
                    isSelected
                      ? 'border-brand-400 shadow-glow ring-2 ring-brand-400/50'
                      : `${style.border} hover:border-slate-600`
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={`Frame ${frame.timestamp_str}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Status Dot */}
                  <div
                    className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${
                      frame.status === 'high_risk'
                        ? 'bg-rose-500 shadow-glow-rose'
                        : frame.status === 'attention_required'
                        ? 'bg-amber-500 shadow-glow-amber'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Findings Count Badge */}
                <div className="mt-1.5 text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <span>{frame.findings_count} finding{frame.findings_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Frame Detail Callout */}
      {activeFrame && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">
                Keyframe at {activeFrame.timestamp_str}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize font-mono text-[10px]">
                Domain: {activeFrame.scene_type}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                activeFrame.status === 'high_risk'
                  ? 'bg-rose-500/20 text-rose-300'
                  : activeFrame.status === 'attention_required'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {activeFrame.status.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-2">
            {activeFrame.findings.map((f, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200">{f.title}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{f.observation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
