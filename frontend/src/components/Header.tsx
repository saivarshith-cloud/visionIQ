import React from 'react';
import { Eye, ShieldAlert, Cpu, Key, FileText, Activity } from 'lucide-react';

interface HeaderProps {
  provider?: string;
  model?: string;
  onOpenKeyModal: () => void;
  onOpenReport?: () => void;
  hasAnalysis: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  provider = 'none',
  model = 'none',
  onOpenKeyModal,
  onOpenReport,
  hasAnalysis
}) => {
  const isCloudActive = provider && provider !== 'none';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 shadow-glow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Eye className="w-5 h-5 text-brand-400 animate-pulse-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">Vision<span className="text-brand-400">IQ</span></span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                v2.0 Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight hidden sm:block">
              Adaptive Visual Intelligence • Upload anything. Understand everything.
            </p>
          </div>
        </div>

        {/* Engine Status & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* AI Provider Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div className={`w-2 h-2 rounded-full ${isCloudActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">
              Provider: <strong className="text-brand-300 capitalize">{provider}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">{model}</span>
          </div>

          {/* API Key Config Button */}
          <button
            onClick={onOpenKeyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-medium transition shadow-sm hover:border-brand-500/50"
            title="Configure Multimodal API Key"
          >
            <Key className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">AI Keys</span>
          </button>

          {/* Export Report Button */}
          {hasAnalysis && onOpenReport && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-glow"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
