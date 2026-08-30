import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Film,
  History,
  ShieldCheck,
  FolderKanban,
  Sliders,
  TerminalSquare
} from 'lucide-react';

export type NavTab = 'dashboard' | 'samples' | 'video' | 'history';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  historyCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  historyCount = 0
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Live Engine', icon: Sparkles },
    { id: 'samples', label: 'Domain Gallery', icon: FolderKanban, badge: '8 Demos' },
    { id: 'video', label: 'Video Inspector', icon: Film, badge: 'FFmpeg' },
    { id: 'history', label: 'Audit History', icon: History, badge: historyCount || undefined },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-slate-800/80 bg-slate-950/60 p-4 space-y-6">
      
      {/* Navigation Menu */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-md ${
                    isActive
                      ? 'bg-brand-500/30 text-brand-200 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grounding Principles Card */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-brand-400 font-semibold text-[11px] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Grounding Contract</span>
        </div>
        <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
          <li>Strict Observation vs Interpretation separation</li>
          <li>Prompt routed via <code className="text-brand-300">scene.type</code></li>
          <li>Zero fabricated coordinates or metrics</li>
          <li>Hedged risk language</li>
        </ul>
      </div>

      {/* Supported Domains List */}
      <div className="space-y-1 text-xs">
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Active Domains (7)
        </div>
        <div className="grid grid-cols-2 gap-1.5 px-1 text-[11px] text-slate-400">
          <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">⚙️ Industrial</div>
          <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">🛣️ Transport</div>
          <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">🛒 Retail</div>
          <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">🏗️ Construction</div>
          <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">🌾 Agriculture</div>
          <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">🔬 Manufacture</div>
          <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">📄 Document</div>
          <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">🌐 General</div>
        </div>
      </div>

    </aside>
  );
};
