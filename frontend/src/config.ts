// VisionIQ API Configuration - Single source of truth
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  status: `${API_BASE_URL}/api/status`,
  setApiKey: `${API_BASE_URL}/api/config/key`,
  analyzeImage: `${API_BASE_URL}/api/analyze/image`,
  analyzeVideo: `${API_BASE_URL}/api/analyze/video`,
  explainFinding: `${API_BASE_URL}/api/findings/explain`,
  updateFindingAction: (id: string) => `${API_BASE_URL}/api/findings/${id}/action`,
  getHistory: `${API_BASE_URL}/api/history`,
  getAnalysisById: (id: string) => `${API_BASE_URL}/api/history/${id}`,
  getSamples: `${API_BASE_URL}/api/samples`,
  qa: `${API_BASE_URL}/api/qa`,
  qaImage: `${API_BASE_URL}/api/qa/image`,
  mediaUrl: (path: string) => `${API_BASE_URL}/api/media/${encodeURIComponent(path)}`,
};

