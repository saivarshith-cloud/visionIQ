import React, { useState } from 'react';
import type { HistoryItem, SceneType, OverallStatus } from '../types/vision';
import { History, Calendar, FileText, Image as ImageIcon, Film, ArrowUpRight, Search, RefreshCw } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryItem[];
  onSelectHistory: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectHistory,
  onRefresh,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.filename.toLowerCase().includes(term) ||
      item.scene_type.toLowerCase().includes(term) ||
      (item.sub_category && item.sub_category.toLowerCase().includes(term)) ||
      item.executive_summary.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-brand-400" />
            <span>Inspection Audit History (SQLite)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Reopen and review persistent visual reasoning runs, findings, and auditor actions.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search filename, domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input pl-8 py-1.5 text-xs rounded-xl"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition"
            title="Refresh History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* History List Table / Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl space-y-2">
          <History className="w-10 h-10 mx-auto text-slate-600 stroke-1" />
          <p className="text-sm font-medium text-slate-300">No past analyses found.</p>
          <p className="text-xs text-slate-500">Run an image or video inspection to record audit entries.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const isVideo = item.media_type === 'video';
            const isHighRisk = item.overall_status === 'high_risk';
            const isAttention = item.overall_status === 'attention_required';

            return (
              <div
                key={item.id}
                onClick={() => onSelectHistory(item.id)}
                className="p-4 rounded-xl glass-card border border-slate-800 hover:border-brand-500/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-brand-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                    {isVideo ? <Film className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-brand-300 transition">
                        {item.filename}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border border-slate-800">
                        {item.scene_type}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {item.executive_summary}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.created_at}
                      </span>
                      <span>•</span>
                      <span>{item.findings_count} Finding{item.findings_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isHighRisk
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isAttention
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.overall_status.replace('_', ' ')}
                  </span>

                  <button className="px-3 py-1.5 rounded-lg bg-slate-900 group-hover:bg-brand-600 text-slate-300 group-hover:text-white text-xs font-semibold flex items-center gap-1 transition">
                    <span>Reopen</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
