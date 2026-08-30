export type SceneType =
  | 'industrial'
  | 'retail'
  | 'transportation'
  | 'construction'
  | 'agriculture'
  | 'manufacturing'
  | 'document'
  | 'general';

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type OverallStatus = 'normal' | 'attention_required' | 'high_risk';
export type ActionStatus = 'pending' | 'confirmed' | 'dismissed' | 'escalated';
export type AnalysisMode = 'inspection' | 'describe';

export interface SceneInfo {
  type: SceneType;
  confidence: ConfidenceLevel;
  sub_category?: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  observation: string;
  interpretation: string;
  recommendation: string;
  bounding_box?: number[] | null;
  action_status?: ActionStatus;
  action_notes?: string;
}

export interface TimelineKeyframe {
  frame_index: number;
  timestamp: number;
  timestamp_str: string;
  thumbnail_url: string;
  status: OverallStatus;
  scene_type: SceneType;
  findings_count: number;
  findings: Finding[];
}

export interface VisionIQAnalysisResponse {
  id: string;
  media_id?: string;
  media_url?: string;
  media_type: 'image' | 'video';
  mode?: AnalysisMode;
  filename?: string;
  scene: SceneInfo;
  analysis_plan: string[];
  findings: Finding[];
  executive_summary: string;
  overall_status: OverallStatus;
  provider?: string;
  model?: string;
  created_at?: string;
  metadata?: {
    video_timeline?: TimelineKeyframe[];
    total_frames_sampled?: number;
    [key: string]: any;
  };
}

export interface NaturalKeyElements {
  primary_subject?: string;
  people_and_activity: string[];
  objects_detected: string[];
  setting_and_atmosphere?: string;
  notable_details: string[];
}

export interface NaturalVisionDescriptionResponse {
  id: string;
  media_url?: string;
  filename?: string;
  media_type: 'image' | 'video';
  mode: 'describe';
  scene_title: string;
  natural_description: string;
  key_elements: NaturalKeyElements;
  tags: string[];
  provider?: string;
  model?: string;
  created_at?: string;
}

export interface ExplainFindingResponse {
  finding_title: string;
  grounded_explanation: string;
  visual_cues: string[];
  risk_factors: string[];
  recommended_mitigation: string;
  confidence_rationale: string;
}

export interface DemoSample {
  id: string;
  filename: string;
  title: string;
  domain: SceneType;
  description: string;
  tags: string[];
  available: boolean;
  url: string;
}

export interface VisualQAResponse {
  answer: string;
  observation: string;
  confidence: ConfidenceLevel;
  caveat?: string | null;
  question?: string;
  created_at?: string;
}

export interface VisualQAItem {
  id: string;
  question: string;
  response: VisualQAResponse;
  timestamp: string;
}

export interface HistoryItem {
  id: string;
  filename: string;
  media_type: 'image' | 'video';
  media_path: string;
  scene_type: SceneType;
  scene_confidence: ConfidenceLevel;
  sub_category?: string;
  overall_status: OverallStatus;
  findings_count: number;
  executive_summary: string;
  created_at: string;
}

