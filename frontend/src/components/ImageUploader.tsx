import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Film, AlertCircle, RefreshCw } from 'lucide-react';

interface ImageUploaderProps {
  onUploadImage: (file: File) => void;
  onUploadVideo: (file: File) => void;
  isLoading: boolean;
  acceptVideo?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadImage,
  onUploadVideo,
  isLoading,
  acceptVideo = true
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage) {
      const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedImageMimes.includes(file.type)) {
        setErrorMsg(`Unsupported image format (${file.type}). Please upload JPG, PNG, or WEBP.`);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg(`Image size exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }
      onUploadImage(file);
    } else if (isVideo && acceptVideo) {
      const allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (!allowedVideoMimes.includes(file.type)) {
        setErrorMsg(`Unsupported video format (${file.type}). Please upload MP4, MOV, or WEBM.`);
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setErrorMsg(`Video size exceeds 100MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }
      onUploadVideo(file);
    } else {
      setErrorMsg('Invalid file type. Please upload a valid image (JPG, PNG, WEBP) or video (MP4, WEBM).');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-brand-400 bg-brand-500/15 shadow-glow'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-brand-400">
            {isLoading ? (
              <RefreshCw className="w-8 h-8 animate-spin text-brand-400" />
            ) : (
              <UploadCloud className="w-8 h-8 group-hover:scale-110 transition-transform" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-200">
              {isLoading
                ? 'Reasoning & Grounding Analysis in progress...'
                : 'Click to upload or drag & drop media'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports <span className="text-slate-300 font-medium">JPG, PNG, WEBP</span> (up to 25MB)
              {acceptVideo && <span> and <span className="text-slate-300 font-medium">MP4, WEBM</span> (up to 100MB)</span>}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> Image Core Loop
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-violet-400" /> FFmpeg Video Timeline
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
