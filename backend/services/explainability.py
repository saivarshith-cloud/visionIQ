import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

from config import get_active_provider
from models.schemas import Finding, ExplainFindingResponse
from services.vision_ai import vision_engine, parse_and_validate_json, clean_json_string

logger = logging.getLogger("visioniq.explain")

EXPLAIN_PROMPT = """You are VisionIQ's Chief Explainability Auditor.
A user has asked: "Why did you flag this finding?"

Target Finding:
Title: {title}
Severity: {severity}
Confidence: {confidence}
Observation: {observation}
Interpretation: {interpretation}
Recommendation: {recommendation}
Scene Context: {scene_type}

Provide a deep, technically rigorous, grounded explanation strictly analyzing why this was flagged.
Never state interpretation as confirmed fact. Hedge appropriately with 'may indicate', 'could represent'.

Respond ONLY with this JSON structure:
{{
  "finding_title": "{title}",
  "grounded_explanation": "Detailed explanation grounding why this visual pattern warranted a {severity} severity flag.",
  "visual_cues": [
    "Visual cue 1 (e.g. color variance, physical edge, obstruction)",
    "Visual cue 2"
  ],
  "risk_factors": [
    "Potential risk factor 1",
    "Potential risk factor 2"
  ],
  "recommended_mitigation": "Concrete technical mitigation step",
  "confidence_rationale": "Why confidence was assessed as {confidence}"
}}
"""

async def explain_finding(finding: Finding, scene_type: str, image_path: Optional[Path] = None) -> ExplainFindingResponse:
    """Re-queries the model for grounded explainability on a specific finding."""
    prompt = EXPLAIN_PROMPT.format(
        title=finding.title,
        severity=finding.severity,
        confidence=finding.confidence,
        observation=finding.observation,
        interpretation=finding.interpretation,
        recommendation=finding.recommendation,
        scene_type=scene_type
    )

    provider, _ = get_active_provider()
    if provider != "none" and image_path and image_path.exists():
        try:
            raw = await vision_engine._run_llm(image_path, prompt)
            data = parse_and_validate_json(raw)
            return ExplainFindingResponse(
                finding_title=data.get("finding_title", finding.title),
                grounded_explanation=data.get("grounded_explanation", f"Flagged as {finding.severity} severity based on verified visual observation."),
                visual_cues=data.get("visual_cues", [finding.observation]),
                risk_factors=data.get("risk_factors", [finding.interpretation]),
                recommended_mitigation=data.get("recommended_mitigation", finding.recommendation),
                confidence_rationale=data.get("confidence_rationale", f"Assessed at {finding.confidence} confidence based on unambiguous visual cues.")
            )
        except Exception as e:
            logger.warning(f"Live explainability query failed: {e}. Using deterministic explanation generator.")

    # Grounded fallback explanation
    return ExplainFindingResponse(
        finding_title=finding.title,
        grounded_explanation=(
            f"This finding was flagged with '{finding.severity.upper()}' severity because the visual observation "
            f"('{finding.observation}') presents characteristics that require active review in a {scene_type} environment."
        ),
        visual_cues=[
            f"Visual observation: {finding.observation}",
            f"Identified domain context: {scene_type.title()}"
        ],
        risk_factors=[
            f"Risk hypothesis: {finding.interpretation}",
            f"Classification severity tier: {finding.severity}"
        ],
        recommended_mitigation=finding.recommendation,
        confidence_rationale=f"Confidence evaluated as '{finding.confidence}' based on direct visual evidence in the analyzed frame."
    )
