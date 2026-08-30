import React, { useState, useEffect } from 'react';
import { VisionIQApi } from './services/api';
import type {
  VisionIQAnalysisResponse,
  NaturalVisionDescriptionResponse,
  DemoSample,
  HistoryItem,
  Finding,
  ActionStatus,
  TimelineKeyframe,
  ExplainFindingResponse,
  AnalysisMode
} from './types/vision';
import { Header } from './components/Header';
import { Sidebar, type NavTab } from './components/Sidebar';
import { ImageUploader } from './components/ImageUploader';
import { DemoSelector } from './components/DemoSelector';
import { MediaViewer } from './components/MediaViewer';
import { ResultsDashboard } from './components/ResultsDashboard';
import { NaturalDescriptionView } from './components/NaturalDescriptionView';
import { VideoTimeline } from './components/VideoTimeline';
import { HistoryView } from './components/HistoryView';
import { ExplainModal } from './components/ExplainModal';
import { PrintableReport } from './components/PrintableReport';
import { ApiKeyConfigModal } from './components/ApiKeyConfigModal';
import { API_BASE_URL } from './config';
import {
  Sparkles,
  Shield,
  Key,
  Cpu,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  FileSearch,
  MessageSquareQuote,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('inspection');
  const [engineStatus, setEngineStatus] = useState<{ status: string; app: string; provider?: string; model?: string; is_connected?: boolean } | null>(null);
  const [samples, setSamples] = useState<DemoSample[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<VisionIQAnalysisResponse | null>(null);
  const [currentDescription, setCurrentDescription] = useState<NaturalVisionDescriptionResponse | null>(null);
  const [currentUploadedFile, setCurrentUploadedFile] = useState<File | undefined>(undefined);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>(undefined);
  const [selectedVideoFrame, setSelectedVideoFrame] = useState<TimelineKeyframe | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('Analyzing media...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [explainFinding, setExplainFinding] = useState<Finding | null>(null);
  const [explanationData, setExplanationData] = useState<ExplainFindingResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // Initial load
  const loadInitialData = async () => {
    try {
      const health = await VisionIQApi.checkHealth();
      setEngineStatus(health);

      const samplesRes = await VisionIQApi.getSamples();
      setSamples(samplesRes.samples);

      const historyRes = await VisionIQApi.getHistory();
      setHistory(historyRes.history);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setErrorMessage(err.message || `Cannot connect to VisionIQ backend at ${API_BASE_URL}. Please ensure the backend server is running.`);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const isCloudConnected = engineStatus?.provider && engineStatus.provider !== 'none';

  // Handlers - Automatic Anomaly Detection on Every Selection / Upload
  const handleSelectSample = async (sample: DemoSample) => {
    setIsLoading(true);
    setLoadingMsg(`Automatically analyzing ${sample.title} for findings & anomalies...`);
    setErrorMessage(null);
    setSelectedSampleId(sample.id);
    setCurrentUploadedFile(undefined);
    setCurrentAnalysis(null);
    setCurrentDescription(null);

    try {
      const result = (await VisionIQApi.analyzeSample(sample.id, 'inspection')) as VisionIQAnalysisResponse;
      setCurrentAnalysis(result);
      setSelectedFindingId(null);
      setActiveTab('dashboard');
      const hist = await VisionIQApi.getHistory();
      setHistory(hist.history);
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed. Please check AI Key connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    setIsLoading(true);
    setLoadingMsg(`Automatically running anomaly & finding detection on '${file.name}'...`);
    setErrorMessage(null);
    setSelectedSampleId(undefined);
    setCurrentUploadedFile(file);
    setCurrentAnalysis(null);
    setCurrentDescription(null);

    try {
      const result = (await VisionIQApi.analyzeImage(file, 'inspection')) as VisionIQAnalysisResponse;
      setCurrentAnalysis(result);
      setSelectedFindingId(null);
      setActiveTab('dashboard');
      const hist = await VisionIQApi.getHistory();
      setHistory(hist.history);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image analysis failed. Please check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadVideo = async (file: File) => {
    setIsLoading(true);
    setLoadingMsg(`Extracting keyframes via FFmpeg & analyzing video '${file.name}'...`);
    setErrorMessage(null);
    setSelectedSampleId(undefined);
    setCurrentAnalysis(null);
    setCurrentDescription(null);

    try {
      const result = await VisionIQApi.analyzeVideo(file);
      setCurrentAnalysis(result);
      setSelectedFindingId(null);
      setActiveTab('video');
      const hist = await VisionIQApi.getHistory();
      setHistory(hist.history);
    } catch (err: any) {
      setErrorMessage(err.message || 'Video analysis failed. Please check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionUpdate = async (findingId: string, action: ActionStatus) => {
    if (!currentAnalysis) return;
    try {
      await VisionIQApi.updateFindingAction(findingId, action, undefined, currentAnalysis.id);
      setCurrentAnalysis((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.map((f) =>
            f.id === findingId ? { ...f, action_status: action } : f
          ),
        };
      });
    } catch (err) {
      console.error('Failed to update action status:', err);
    }
  };

  const handleExplainFinding = async (finding: Finding) => {
    setExplainFinding(finding);
    setExplanationData(null);
    setIsExplaining(true);
    try {
      const res = await VisionIQApi.explainFinding(
        finding,
        currentAnalysis?.scene.type || 'general',
        currentAnalysis?.filename
      );
      setExplanationData(res);
    } catch (err: any) {
      console.error('Failed to explain finding:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSelectHistory = async (analysisId: string) => {
    setIsLoading(true);
    setLoadingMsg('Loading audit record from SQLite...');
    try {
      const data = await VisionIQApi.getAnalysisById(analysisId);
      setCurrentAnalysis(data);
      setCurrentDescription(null);
      setSelectedFindingId(null);
      if (data.media_type === 'video') {
        setActiveTab('video');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open analysis record');
    } finally {
      setIsLoading(false);
    }
  };

  const currentMediaUrl = currentDescription ? currentDescription.media_url : currentAnalysis?.media_url;
  const hasActiveResult = !!currentAnalysis || !!currentDescription;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        provider={engineStatus?.provider}
        model={engineStatus?.model}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        hasAnalysis={!!currentAnalysis}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setErrorMessage(null);
          }}
          historyCount={history.length}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-full">
          
          {/* NO AI PROVIDER CONNECTED BANNER */}
          {!isCloudConnected && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-glow-amber">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm">
                    No Real AI Provider Connected
                  </div>
                  <div className="text-slate-300 text-xs mt-0.5">
                    VisionIQ requires a real multimodal API key (<strong>GEMINI_API_KEY</strong> or <strong>ANTHROPIC_API_KEY</strong>) to inspect images. Mock fallbacks are disabled.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Connect API Key</span>
              </button>
            </div>
          )}

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-glow-rose">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-6 rounded-2xl glass-panel border border-brand-500/40 text-center space-y-3 shadow-glow">
              <div className="w-9 h-9 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-200">{loadingMsg}</p>
              <p className="text-xs text-slate-400">Executing multimodal vision reasoning with active provider.</p>
            </div>
          )}

          {/* TAB 1: LIVE DASHBOARD / ANALYSIS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Analysis Mode Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Analysis Mode:</span>
                  <span className="text-xs text-slate-300">Choose how VisionIQ interprets your media</span>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setAnalysisMode('describe');
                      if (currentAnalysis && !currentDescription) {
                        // Keep current or switch
                      }
                    }}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                      analysisMode === 'describe'
                        ? 'bg-brand-600 text-white shadow-glow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    <span>Explain / Describe Photo</span>
                  </button>

                  <button
                    onClick={() => setAnalysisMode('inspection')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                      analysisMode === 'inspection'
                        ? 'bg-brand-600 text-white shadow-glow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>Domain Safety Inspection</span>
                  </button>
                </div>
              </div>

              {/* If no result yet, show hero / upload & quick sample grid */}
              {!hasActiveResult ? (
                <div className="space-y-6">
                  {/* Hero banner */}
                  <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 p-8 sm:p-10 shadow-glow">
                    <div className="max-w-2xl space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold border border-brand-500/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Adaptive Multimodal Vision Architecture</span>
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                        Upload anything. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-cyan to-accent-emerald">
                          Understand everything.
                        </span>
                      </h1>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {analysisMode === 'describe'
                          ? "VisionIQ generates plain-language photo descriptions like ChatGPT Vision — detailing people, objects, setting, actions, and notable nuances without forcing rigid severity metrics."
                          : "VisionIQ inspects incoming images and videos against 7 specialized industrial & civil domains, selecting tailored reasoning prompts with strict observation vs. interpretation separation."}
                      </p>
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  <ImageUploader
                    onUploadImage={handleUploadImage}
                    onUploadVideo={handleUploadVideo}
                    isLoading={isLoading}
                  />

                  {/* Demo Gallery */}
                  <DemoSelector
                    samples={samples}
                    onSelectSample={handleSelectSample}
                    isLoading={isLoading}
                    selectedSampleId={selectedSampleId}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Bar for Resetting / Uploading Another */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCurrentAnalysis(null);
                        setCurrentDescription(null);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Analyze Another Photo</span>
                    </button>

                    <div className="text-xs text-slate-400 font-mono">
                      File: <strong className="text-slate-200">
                        {currentDescription?.filename || currentAnalysis?.filename}
                      </strong>
                    </div>
                  </div>

                  {/* 2-Column Responsive Workspace: Media View on Left, Results on Right */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Media Viewer with Canvas Overlays */}
                    <div className="lg:col-span-5 flex flex-col space-y-4">
                      <MediaViewer
                        mediaUrl={currentMediaUrl}
                        mediaType="image"
                        findings={currentAnalysis ? currentAnalysis.findings : []}
                        selectedFindingId={selectedFindingId}
                        onSelectFinding={setSelectedFindingId}
                      />
                    </div>

                    {/* Results: Either Natural Description View OR Domain Inspection Dashboard */}
                    <div className="lg:col-span-7 space-y-6">
                      {currentDescription ? (
                        <NaturalDescriptionView
                          description={currentDescription}
                          onSwitchToInspection={() => {
                            setAnalysisMode('inspection');
                            if (selectedSampleId) {
                              const s = samples.find(x => x.id === selectedSampleId);
                              if (s) handleSelectSample(s);
                            }
                          }}
                        />
                      ) : currentAnalysis ? (
                        <ResultsDashboard
                          analysis={currentAnalysis}
                          onExplainFinding={handleExplainFinding}
                          onActionUpdate={handleActionUpdate}
                          selectedFindingId={selectedFindingId}
                          onSelectFinding={setSelectedFindingId}
                          sampleId={selectedSampleId}
                          uploadedFile={currentUploadedFile}
                        />
                      ) : null}
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: DOMAIN SAMPLES */}
          {activeTab === 'samples' && (
            <div className="space-y-6">
              <DemoSelector
                samples={samples}
                onSelectSample={handleSelectSample}
                isLoading={isLoading}
                selectedSampleId={selectedSampleId}
              />
            </div>
          )}

          {/* TAB 3: VIDEO INSPECTOR */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              {!currentAnalysis || currentAnalysis.media_type !== 'video' ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-2">
                    <h2 className="text-base font-bold text-white">Video Temporal Keyframe Inspector</h2>
                    <p className="text-xs text-slate-400">
                      Upload an MP4 or WEBM clip to run FFmpeg 2.5s interval frame sampling and timeline aggregation with active AI.
                    </p>
                  </div>
                  <ImageUploader
                    onUploadImage={handleUploadImage}
                    onUploadVideo={handleUploadVideo}
                    isLoading={isLoading}
                    acceptVideo={true}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Video Timeline Scrubber */}
                  {currentAnalysis.metadata?.video_timeline && (
                    <VideoTimeline
                      timeline={currentAnalysis.metadata.video_timeline}
                      onSelectFrame={(frame) => setSelectedVideoFrame(frame)}
                      selectedFrameIndex={selectedVideoFrame?.frame_index}
                    />
                  )}

                  {/* Results Dashboard for Video */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5">
                      <MediaViewer
                        mediaUrl={
                          selectedVideoFrame
                            ? selectedVideoFrame.thumbnail_url
                            : currentAnalysis.media_url
                        }
                        mediaType={selectedVideoFrame ? 'image' : 'video'}
                        findings={
                          selectedVideoFrame
                            ? selectedVideoFrame.findings
                            : currentAnalysis.findings
                        }
                      />
                    </div>
                    <div className="lg:col-span-7">
                      <ResultsDashboard
                        analysis={currentAnalysis}
                        onExplainFinding={handleExplainFinding}
                        onActionUpdate={handleActionUpdate}
                        selectedFindingId={selectedFindingId}
                        onSelectFinding={setSelectedFindingId}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORY AUDIT */}
          {activeTab === 'history' && (
            <HistoryView
              history={history}
              onSelectHistory={handleSelectHistory}
              onRefresh={async () => {
                const res = await VisionIQApi.getHistory();
                setHistory(res.history);
              }}
              isLoading={isLoading}
            />
          )}

        </main>
      </div>

      {/* MODALS */}
      {/* 1. Grounded Explainability Modal */}
      <ExplainModal
        isOpen={!!explainFinding}
        onClose={() => setExplainFinding(null)}
        finding={explainFinding}
        explanation={explanationData}
        isLoading={isExplaining}
      />

      {/* 2. Formal Printable Inspection Report */}
      <PrintableReport
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        analysis={currentAnalysis}
      />

      {/* 3. API Key Configuration Modal */}
      <ApiKeyConfigModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentProvider={engineStatus?.provider}
        onKeyUpdated={loadInitialData}
      />

    </div>
  );
}
