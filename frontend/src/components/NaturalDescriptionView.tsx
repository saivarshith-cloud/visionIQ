import React from 'react';
import type { NaturalVisionDescriptionResponse } from '../types/vision';
import {
  Sparkles,
  Users,
  Box,
  Sun,
  Info,
  Tag,
  CheckCircle2,
  Cpu,
  Share2,
  FileText
} from 'lucide-react';

interface NaturalDescriptionViewProps {
  description: NaturalVisionDescriptionResponse;
  onSwitchToInspection?: () => void;
}

export const NaturalDescriptionView: React.FC<NaturalDescriptionViewProps> = ({
  description,
  onSwitchToInspection
}) => {
  const { key_elements } = description;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Multimodal Vision Narrative</span>
          </div>

          {description.provider && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded via <strong>{description.provider.toUpperCase()}</strong> ({description.model})</span>
            </div>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {description.scene_title}
        </h1>

        {/* Natural Language Narrative (ChatGPT-style) */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-slate-200 text-sm leading-relaxed whitespace-pre-line font-normal">
          {description.natural_description}
        </div>
      </div>

      {/* Structured Key Visual Elements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Primary Subject */}
        {key_elements.primary_subject && (
          <div className="p-4 rounded-xl glass-card border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Sparkles className="w-4 h-4" />
              <span>Primary Subject</span>
            </div>
            <p className="text-xs text-slate-200 leading-normal font-medium">
              {key_elements.primary_subject}
            </p>
          </div>
        )}

        {/* 2. Setting & Atmosphere */}
        {key_elements.setting_and_atmosphere && (
          <div className="p-4 rounded-xl glass-card border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sun className="w-4 h-4" />
              <span>Setting & Lighting</span>
            </div>
            <p className="text-xs text-slate-300 leading-normal">
              {key_elements.setting_and_atmosphere}
            </p>
          </div>
        )}

        {/* 3. People & Activity */}
        <div className="p-4 rounded-xl glass-card border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
            <Users className="w-4 h-4" />
            <span>People & Actions</span>
          </div>
          {key_elements.people_and_activity && key_elements.people_and_activity.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {key_elements.people_and_activity.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No human subjects detected in this frame.</p>
          )}
        </div>

        {/* 4. Objects Detected */}
        <div className="p-4 rounded-xl glass-card border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Box className="w-4 h-4" />
            <span>Key Objects Identified</span>
          </div>
          {key_elements.objects_detected && key_elements.objects_detected.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {key_elements.objects_detected.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">General visual elements observed.</p>
          )}
        </div>

        {/* 5. Notable Details */}
        {key_elements.notable_details && key_elements.notable_details.length > 0 && (
          <div className="md:col-span-2 p-4 rounded-xl glass-card border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Info className="w-4 h-4" />
              <span>Notable Nuances & Subtleties</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {key_elements.notable_details.map((detail, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Tags Cloud & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {description.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 font-mono text-[10px] border border-slate-800"
            >
              #{tag}
            </span>
          ))}
        </div>

        {onSwitchToInspection && (
          <button
            onClick={onSwitchToInspection}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1.5 transition"
          >
            <span>Run Domain Safety Inspection</span>
            <span className="text-slate-500">→</span>
          </button>
        )}
      </div>

    </div>
  );
};
