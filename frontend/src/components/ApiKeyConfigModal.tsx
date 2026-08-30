import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';
import { VisionIQApi } from '../services/api';

interface ApiKeyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider?: string;
  onKeyUpdated: () => void;
}

export const ApiKeyConfigModal: React.FC<ApiKeyConfigModalProps> = ({
  isOpen,
  onClose,
  currentProvider,
  onKeyUpdated
}) => {
  const [provider, setProvider] = useState<'gemini' | 'anthropic' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid API key.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await VisionIQApi.setApiKey(provider, apiKey.trim());
      setStatusMsg({
        type: 'success',
        text: `Successfully configured and activated ${res.provider?.toUpperCase()} (${res.model})!`
      });
      await onKeyUpdated();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save API key' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl glass-panel border border-slate-700/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Multimodal AI Key Setup</h3>
              <p className="text-[11px] text-slate-400">Configure Google Gemini / Anthropic / OpenAI keys</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-400" />
            <span>Active Provider:</span>
          </div>
          <span className="font-mono text-brand-300 font-bold capitalize">
            {currentProvider || 'Local CV Engine'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Select Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gemini', label: 'Google Gemini' },
                { id: 'anthropic', label: 'Anthropic Claude' },
                { id: 'openai', label: 'OpenAI GPT-4o' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`p-2.5 rounded-xl border text-center font-medium transition ${
                    provider === p.id
                      ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {provider.toUpperCase()} API Key
            </label>
            <input
              type="password"
              placeholder={`Enter ${provider} key (e.g. AIzaSy... or sk-ant-...)`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full glass-input text-xs font-mono"
            />
            <p className="text-[10px] text-slate-500">
              Keys are kept only in server memory for the session and are never committed.
            </p>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-glow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save & Activate'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
