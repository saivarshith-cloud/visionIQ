import { API_BASE_URL, API_ENDPOINTS } from '../config';
import type {
  VisionIQAnalysisResponse,
  NaturalVisionDescriptionResponse,
  ExplainFindingResponse,
  DemoSample,
  HistoryItem,
  Finding,
  ActionStatus,
  AnalysisMode,
  VisualQAResponse
} from '../types/vision';

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init);
    return res;
  } catch (err: any) {
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new Error(`Cannot connect to VisionIQ backend at ${API_BASE_URL}. Please ensure the backend server is running.`);
    }
    throw err;
  }
}

export class VisionIQApi {
  static async checkHealth(): Promise<{ status: string; app: string; provider?: string; model?: string; is_connected?: boolean }> {
    const res = await apiFetch(API_ENDPOINTS.health);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  }

  static async setApiKey(provider: 'gemini' | 'anthropic' | 'openai', apiKey: string): Promise<any> {
    const res = await apiFetch(API_ENDPOINTS.setApiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to configure API key');
    }
    return res.json();
  }

  static async getSamples(): Promise<{ samples: DemoSample[] }> {
    const res = await apiFetch(API_ENDPOINTS.getSamples);
    if (!res.ok) throw new Error(`Failed to fetch samples: ${res.statusText}`);
    return res.json();
  }

  static async analyzeSample(sampleId: string, mode: AnalysisMode = 'inspection'): Promise<VisionIQAnalysisResponse | NaturalVisionDescriptionResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/analyze/sample/${encodeURIComponent(sampleId)}?mode=${mode}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Sample analysis failed');
    }
    return res.json();
  }

  static async describeSample(sampleId: string): Promise<NaturalVisionDescriptionResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/describe/sample/${encodeURIComponent(sampleId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Description generation failed');
    }
    return res.json();
  }

  static async analyzeImage(file: File, mode: AnalysisMode = 'inspection'): Promise<VisionIQAnalysisResponse | NaturalVisionDescriptionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(`${API_ENDPOINTS.analyzeImage}?mode=${mode}`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Image analysis failed');
    }
    return res.json();
  }

  static async describeImage(file: File): Promise<NaturalVisionDescriptionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(`${API_BASE_URL}/api/describe/image`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Image description failed');
    }
    return res.json();
  }

  static async analyzeVideo(file: File): Promise<VisionIQAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(API_ENDPOINTS.analyzeVideo, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Video analysis failed');
    }
    return res.json();
  }

  static async explainFinding(
    finding: Finding,
    sceneType: string,
    mediaId?: string
  ): Promise<ExplainFindingResponse> {
    const res = await apiFetch(API_ENDPOINTS.explainFinding, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finding,
        scene_type: sceneType,
        media_id: mediaId
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Explainability request failed');
    }
    return res.json();
  }

  static async updateFindingAction(
    findingId: string,
    action: ActionStatus,
    notes?: string,
    analysisId?: string
  ): Promise<any> {
    const res = await apiFetch(API_ENDPOINTS.updateFindingAction(findingId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        notes,
        analysis_id: analysisId
      })
    });

    if (!res.ok) throw new Error('Failed to update finding action');
    return res.json();
  }

  static async getHistory(): Promise<{ history: HistoryItem[] }> {
    const res = await apiFetch(API_ENDPOINTS.getHistory);
    if (!res.ok) throw new Error('Failed to load history');
    return res.json();
  }

  static async getAnalysisById(id: string): Promise<VisionIQAnalysisResponse> {
    const res = await apiFetch(API_ENDPOINTS.getAnalysisById(id));
    if (!res.ok) throw new Error('Failed to retrieve past analysis');
    return res.json();
  }

  static async askQuestion(params: {
    question: string;
    mediaUrl?: string;
    mediaId?: string;
    sampleId?: string;
    file?: File;
  }): Promise<VisualQAResponse> {
    if (params.file) {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('question', params.question);
      const res = await apiFetch(API_ENDPOINTS.qaImage, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Visual Q&A request failed');
      }
      return res.json();
    }

    const res = await apiFetch(API_ENDPOINTS.qa, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: params.question,
        media_url: params.mediaUrl,
        media_id: params.mediaId,
        sample_id: params.sampleId
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Visual Q&A request failed');
    }
    return res.json();
  }
}

