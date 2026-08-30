import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Eye,
  Info,
  CheckCircle2,
  Clock,
  Loader2,
  Hash
} from 'lucide-react';
import type { VisualQAResponse, VisualQAItem } from '../types/vision';
import { VisionIQApi } from '../services/api';

interface AskVisionIQProps {
  mediaUrl?: string;
  mediaId?: string;
  sampleId?: string;
  uploadedFile?: File;
  sceneType?: string;
}

export const AskVisionIQ: React.FC<AskVisionIQProps> = ({
  mediaUrl,
  mediaId,
  sampleId,
  uploadedFile,
  sceneType = 'general'
}) => {
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<VisualQAItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Quick domain-aware prompt suggestions
  const getPromptSuggestions = () => {
    switch (sceneType) {
      case 'transportation':
        return [
          'How many parking slots are free vs occupied?',
          'What pavement defects or cracks are visible?',
          'Are lane boundary markings clearly painted and visible?'
        ];
      case 'retail':
      case 'industrial':
        return [
          'How many items need restocking or are low in inventory?',
          'Are there any trip hazards or blocked walkways?',
          'What is written on the primary visible labels/signs?'
        ];
      case 'manufacturing':
        return [
          'Are all screws and fasteners properly seated?',
          'Are there any visible surface scratches or solder bridges?'
        ];
      case 'document':
        return [
          'What is the total amount and invoice date?',
          'Are all required signature fields signed?'
        ];
      default:
        return [
          'How many primary objects are visible in this scene?',
          'What is the overall condition and lighting quality?',
          'Are there any notable objects or potential concerns?'
        ];
    }
  };

  const handleAsk = async (qText?: string) => {
    const targetQ = (qText || question).trim();
    if (!targetQ || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res: VisualQAResponse = await VisionIQApi.askQuestion({
        question: targetQ,
        mediaUrl,
        mediaId,
        sampleId,
        file: uploadedFile
      });

      const newItem: VisualQAItem = {
        id: `qa_${Date.now()}`,
        question: targetQ,
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setQaHistory((prev) => [newItem, ...prev]);
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to get answer from VisionIQ engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = getPromptSuggestions();

  return (
    <div className="p-6 rounded-2xl glass-panel border border-brand-500/30 space-y-5 shadow-glow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 flex items-center justify-center shadow-glow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Ask VisionIQ</h3>
              <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-mono border border-brand-500/30">
                Visual Q&amp;A
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ask any specific question about this image (counts, details, anomalies, labels).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span>Multimodal Visual Grounding</span>
        </div>
      </div>

      {/* Suggested Question Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Suggested Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(sug)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-brand-500/50 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <HelpCircle className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>{sug}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="relative flex items-center gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type a specific question about this image (e.g. 'How many parking slots are free?', 'How many boxes need restocking?')..."
          disabled={isLoading}
          className="flex-1 px-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-100 placeholder-slate-500 text-xs sm:text-sm outline-none transition"
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="px-5 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 shadow-glow disabled:shadow-none shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask VisionIQ</span>
            </>
          )}
        </button>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Q&A Results Stream */}
      {qaHistory.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Q&amp;A Responses ({qaHistory.length})
            </span>
            <button
              onClick={() => setQaHistory([])}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              Clear conversation
            </button>
          </div>

          <div className="space-y-4">
            {qaHistory.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm"
              >
                {/* Question */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                      Q
                    </span>
                    <h4 className="text-sm font-semibold text-white">
                      {item.question}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.timestamp}
                  </span>
                </div>

                {/* Answer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Direct Answer</span>
                    </div>

                    {/* Confidence Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                        item.response.confidence === 'high'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : item.response.confidence === 'medium'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {item.response.confidence} Confidence
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed font-medium bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
                    {item.response.answer}
                  </p>
                </div>

                {/* Visual Observation */}
                {item.response.observation && (
                  <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-accent-cyan" />
                      <span>Visual Evidence &amp; Observation</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.response.observation}
                    </p>
                  </div>
                )}

                {/* Caveat / Estimation Note */}
                {item.response.caveat && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">Estimation / Visual Caveat: </span>
                      <span>{item.response.caveat}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
