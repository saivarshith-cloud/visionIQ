import React from 'react';
import type { DemoSample, SceneType } from '../types/vision';
import { Play, Sparkles, Shield, Tag, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface DemoSelectorProps {
  samples: DemoSample[];
  onSelectSample: (sample: DemoSample) => void;
  isLoading: boolean;
  selectedSampleId?: string;
}

const DOMAIN_EMOJIS: Record<SceneType, string> = {
  industrial: '⚙️',
  transportation: '🛣️',
  retail: '🛒',
  construction: '🏗️',
  agriculture: '🌾',
  manufacturing: '🔬',
  document: '📄',
  general: '🛋️',
};

export const DemoSelector: React.FC<DemoSelectorProps> = ({
  samples,
  onSelectSample,
  isLoading,
  selectedSampleId
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Bundled Domain Demos</span>
          </h2>
          <p className="text-xs text-slate-400">
            Click any test scene to execute full real-time classification, prompt routing, and grounded reasoning.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-semibold border border-brand-500/20">
          {samples.length} Ready Samples
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {samples.map((sample) => {
          const isSelected = selectedSampleId === sample.id;
          const emoji = DOMAIN_EMOJIS[sample.domain] || '🔍';
          const imageUrl = `${API_BASE_URL}${sample.url}`;

          return (
            <div
              key={sample.id}
              onClick={() => !isLoading && onSelectSample(sample)}
              className={`group relative rounded-xl overflow-hidden glass-card cursor-pointer border transition-all duration-200 flex flex-col justify-between p-3.5 ${
                isSelected
                  ? 'border-brand-400 bg-brand-500/10 ring-2 ring-brand-400 shadow-glow'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {/* Thumbnail Image */}
              <div className="relative h-28 rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-800/80">
                <img
                  src={imageUrl}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-white uppercase border border-slate-700 flex items-center gap-1">
                  <span>{emoji}</span>
                  <span>{sample.domain}</span>
                </div>
                {sample.id === 'indoor_room' && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[9px] font-extrabold uppercase">
                    Grounding Test
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 mb-3 flex-1">
                <h3 className="text-xs font-bold text-slate-100 group-hover:text-brand-300 transition">
                  {sample.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {sample.description}
                </p>
              </div>

              {/* Tags & Action Button */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex flex-wrap gap-1">
                  {sample.tags.slice(0, 2).map((tag, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-400 border border-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  disabled={isLoading}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-800 group-hover:bg-brand-600 text-slate-200 group-hover:text-white'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Analyze Scene</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
