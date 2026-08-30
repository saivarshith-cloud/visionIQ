import React from 'react';
import type { VisionIQAnalysisResponse } from '../types/vision';
import { Printer, Download, X, Shield, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface PrintableReportProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: VisionIQAnalysisResponse | null;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  isOpen,
  onClose,
  analysis
}) => {
  if (!isOpen || !analysis) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 my-8 space-y-8 print:p-0 print:shadow-none print:m-0">
        
        {/* Action Header (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>VisionIQ Formal Visual Inspection Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formal Report Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              VISION<span className="text-blue-600">IQ</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-1">
              Adaptive Visual Intelligence Engine • Audit Certificate
            </p>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              <div><strong>Document ID:</strong> {analysis.id}</div>
              <div><strong>Target File:</strong> {analysis.filename || 'Direct Upload Media'}</div>
              <div><strong>Date Generated:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="inline-block px-4 py-1.5 rounded-lg border-2 font-black text-xs uppercase tracking-wider text-slate-900 border-slate-900">
              {analysis.overall_status.replace('_', ' ')}
            </div>
            <div className="text-xs text-slate-600">
              <div><strong>Classified Domain:</strong> <span className="uppercase">{analysis.scene.type}</span></div>
              <div><strong>Confidence:</strong> {analysis.scene.confidence.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
            1. Executive Assessment Summary
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            {analysis.executive_summary}
          </p>
        </div>

        {/* Findings Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              2. Grounded Findings Breakdown ({analysis.findings.length})
            </h2>
            <span className="text-xs text-slate-500 font-semibold">Strict Triad Grounding</span>
          </div>

          <div className="space-y-4">
            {analysis.findings.map((f, idx) => (
              <div
                key={f.id || idx}
                className="p-4 rounded-xl border border-slate-300 bg-white space-y-3 page-break-inside-avoid"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900">
                    {idx + 1}. {f.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 border border-slate-300">
                      Severity: {f.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 border border-slate-300">
                      Auditor: {f.action_status || 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-blue-700 block mb-1">Literal Observation:</strong>
                    <span className="text-slate-700">{f.observation}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-purple-700 block mb-1">Hedged Interpretation:</strong>
                    <span className="text-slate-700">{f.interpretation}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-emerald-700 block mb-1">Recommended Action:</strong>
                    <span className="text-slate-700">{f.recommendation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures & Certification */}
        <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-8">
              Lead Visual AI Inspector
            </div>
            <div className="border-b border-slate-400 pb-1 text-slate-700 font-mono">
              VisionIQ Multi-Modal Engine v2.0
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-8">
              Human Auditor Sign-off
            </div>
            <div className="border-b border-slate-400 pb-1 text-slate-400">
              Signature: ___________________________
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
