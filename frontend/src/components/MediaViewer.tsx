import React, { useRef, useState, useEffect } from 'react';
import type { Finding, SeverityLevel } from '../types/vision';
import { API_BASE_URL } from '../config';
import { Maximize2, Layers, EyeOff, Eye, Image as ImageIcon } from 'lucide-react';

interface MediaViewerProps {
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  findings: Finding[];
  selectedFindingId?: string | null;
  onSelectFinding?: (id: string | null) => void;
}

const SEVERITY_COLORS: Record<SeverityLevel, { stroke: string; fill: string; text: string }> = {
  critical: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.20)', text: '#ffffff' },
  high: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.20)', text: '#ffffff' },
  medium: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.20)', text: '#ffffff' },
  low: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.20)', text: '#ffffff' },
};

export const MediaViewer: React.FC<MediaViewerProps> = ({
  mediaUrl,
  mediaType,
  findings,
  selectedFindingId,
  onSelectFinding
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Full URL resolution
  const fullMediaUrl = mediaUrl
    ? mediaUrl.startsWith('http')
      ? mediaUrl
      : `${API_BASE_URL}${mediaUrl}`
    : undefined;

  // Filter findings that actually have grounded bounding boxes
  const groundedFindings = findings.filter(
    (f) => Array.isArray(f.bounding_box) && f.bounding_box.length === 4
  );

  const drawBoundingBoxes = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !showOverlays || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas pixel buffer to actual rendered image dimensions
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    groundedFindings.forEach((finding) => {
      if (!finding.bounding_box) return;
      const [rawY1, rawX1, rawY2, rawX2] = finding.bounding_box;

      // Detect if 0-1000 scale or 0-1 scale
      const isThousandScale = rawY2 > 1.0 || rawX2 > 1.0;
      const divisor = isThousandScale ? 1000 : 1.0;

      const y1 = (rawY1 / divisor) * canvas.height;
      const x1 = (rawX1 / divisor) * canvas.width;
      const y2 = (rawY2 / divisor) * canvas.height;
      const x2 = (rawX2 / divisor) * canvas.width;

      const width = x2 - x1;
      const height = y2 - y1;

      const isSelected = selectedFindingId === finding.id;
      const colors = SEVERITY_COLORS[finding.severity] || SEVERITY_COLORS.medium;

      // Draw bounding box
      ctx.save();
      ctx.fillStyle = colors.fill;
      ctx.fillRect(x1, y1, width, height);

      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = isSelected ? 3.5 : 2;
      if (isSelected) {
        ctx.shadowColor = colors.stroke;
        ctx.shadowBlur = 12;
      }
      ctx.strokeRect(x1, y1, width, height);

      // Draw label pill
      const label = `${finding.title} (${finding.severity.toUpperCase()})`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const padding = 6;
      const pillHeight = 20;

      ctx.fillStyle = colors.stroke;
      ctx.shadowBlur = 0;
      ctx.fillRect(x1, Math.max(0, y1 - pillHeight), textWidth + padding * 2, pillHeight);

      ctx.fillStyle = colors.text;
      ctx.fillText(label, x1 + padding, Math.max(14, y1 - 6));

      ctx.restore();
    });
  };

  useEffect(() => {
    drawBoundingBoxes();
    window.addEventListener('resize', drawBoundingBoxes);
    return () => window.removeEventListener('resize', drawBoundingBoxes);
  }, [groundedFindings, selectedFindingId, showOverlays, imageLoaded]);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden glass-panel border border-slate-800">
      
      {/* Top Media Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <ImageIcon className="w-4 h-4 text-brand-400" />
          <span>Visual Canvas</span>
          {groundedFindings.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-semibold border border-brand-500/30">
              {groundedFindings.length} Bounding Box{groundedFindings.length > 1 ? 'es' : ''} Detected
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
              No Bounding Coordinates (Grounded Text Only)
            </span>
          )}
        </div>

        {groundedFindings.length > 0 && (
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              showOverlays
                ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showOverlays ? 'Hide Boxes' : 'Show Boxes'}</span>
          </button>
        )}
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-slate-950 flex items-center justify-center p-4 min-h-[380px] overflow-hidden"
      >
        {fullMediaUrl ? (
          mediaType === 'video' ? (
            <video
              src={fullMediaUrl}
              controls
              className="max-h-[520px] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
            />
          ) : (
            <div className="relative inline-block max-h-[520px]">
              <img
                ref={imgRef}
                src={fullMediaUrl}
                alt="Analyzed Media"
                onLoad={() => {
                  setImageLoaded(true);
                  drawBoundingBoxes();
                }}
                className="max-h-[520px] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800/80"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none rounded-xl"
              />
            </div>
          )
        ) : (
          <div className="text-center text-slate-500 space-y-2">
            <ImageIcon className="w-12 h-12 mx-auto stroke-1 text-slate-600" />
            <p className="text-sm">Select or upload an image or video to begin visual intelligence analysis.</p>
          </div>
        )}
      </div>

    </div>
  );
};
