from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

# Bounding box is [ymin, xmin, ymax, xmax] or [x1, y1, x2, y2]
# Optional per finding - NEVER fabricate if missing
BoundingBox = List[float]

class SceneInfo(BaseModel):
    type: Literal[
        "industrial",
        "retail",
        "transportation",
        "construction",
        "agriculture",
        "manufacturing",
        "document",
        "general"
    ]
    confidence: Literal["high", "medium", "low"]
    sub_category: Optional[str] = None

class Finding(BaseModel):
    id: Optional[str] = None
    title: str
    severity: Literal["low", "medium", "high", "critical"]
    confidence: Literal["high", "medium", "low"]
    observation: str = Field(description="What was actually seen with zero speculation")
    interpretation: str = Field(description="What it might mean, hedged appropriately")
    recommendation: str = Field(description="Concrete next action")
    bounding_box: Optional[BoundingBox] = None
    action_status: Optional[Literal["pending", "confirmed", "dismissed", "escalated"]] = "pending"
    action_notes: Optional[str] = None

class NaturalKeyElements(BaseModel):
    primary_subject: Optional[str] = None
    people_and_activity: List[str] = Field(default_factory=list)
    objects_detected: List[str] = Field(default_factory=list)
    setting_and_atmosphere: Optional[str] = None
    notable_details: List[str] = Field(default_factory=list)

class NaturalVisionDescriptionResponse(BaseModel):
    id: str
    media_url: Optional[str] = None
    filename: Optional[str] = None
    media_type: Literal["image", "video"] = "image"
    mode: Literal["describe"] = "describe"
    scene_title: str
    natural_description: str
    key_elements: NaturalKeyElements
    tags: List[str] = Field(default_factory=list)
    provider: Optional[str] = None
    model: Optional[str] = None
    created_at: Optional[str] = None

class VisionIQAnalysisResponse(BaseModel):
    id: Optional[str] = None
    media_id: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Literal["image", "video"] = "image"
    mode: Literal["inspection", "describe"] = "inspection"
    filename: Optional[str] = None
    scene: SceneInfo
    analysis_plan: List[str]
    findings: List[Finding]
    executive_summary: str
    overall_status: Literal["normal", "attention_required", "high_risk"]
    created_at: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ExplainFindingRequest(BaseModel):
    finding_id: Optional[str] = None
    finding: Finding
    scene_type: str
    media_id: Optional[str] = None

class ExplainFindingResponse(BaseModel):
    finding_title: str
    grounded_explanation: str
    visual_cues: List[str]
    risk_factors: List[str]
    recommended_mitigation: str
    confidence_rationale: str

class UpdateFindingActionRequest(BaseModel):
    action: Literal["confirmed", "dismissed", "escalated", "pending"]
    notes: Optional[str] = None
    analysis_id: Optional[str] = None

class ApiKeyConfigRequest(BaseModel):
    provider: Literal["gemini", "anthropic", "openai"]
    api_key: str

class VisualQARequest(BaseModel):
    media_url: Optional[str] = None
    media_id: Optional[str] = None
    question: str
    sample_id: Optional[str] = None

class VisualQAResponse(BaseModel):
    answer: str
    observation: str
    confidence: Literal["high", "medium", "low"]
    caveat: Optional[str] = None
    question: Optional[str] = None
    created_at: Optional[str] = None

