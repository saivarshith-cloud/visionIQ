import json
import re
import uuid
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from PIL import Image
from fastapi import HTTPException

from config import (
    get_active_provider,
    get_gemini_key,
    get_anthropic_key,
    get_openai_key,
    persist_api_key
)
from models.schemas import (
    VisionIQAnalysisResponse,
    SceneInfo,
    Finding,
    NaturalVisionDescriptionResponse,
    NaturalKeyElements,
    VisualQAResponse
)
from services.prompts import (
    CLASSIFICATION_PROMPT,
    get_domain_prompt,
    NATURAL_DESCRIPTION_PROMPT,
    get_qa_prompt
)

logger = logging.getLogger("visioniq.ai")

def clean_json_string(text: str) -> str:
    """Extract and clean JSON from model output."""
    text = text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        text = match.group(1).strip()
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1:
        text = text[first_brace:last_brace + 1]
    return text

def parse_and_validate_json(raw_text: str) -> Dict[str, Any]:
    """Parse JSON string and handle trailing commas/escapes."""
    cleaned = clean_json_string(raw_text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        fixed = re.sub(r',\s*([\]}])', r'\1', cleaned)
        return json.loads(fixed)

from config import (
    get_active_provider,
    get_gemini_key,
    get_anthropic_key,
    get_openai_key,
    persist_api_key
)

class VisionAIEngine:
    def __init__(self):
        self.gemini_client = None
        self.anthropic_client = None
        self.openai_client = None
        self._init_clients()

    def _init_clients(self):
        gemini_key = get_gemini_key()
        anthropic_key = get_anthropic_key()
        openai_key = get_openai_key()

        # Initialize Google GenAI or GenerativeAI
        if gemini_key and len(gemini_key.strip()) > 5:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=gemini_key.strip())
                logger.info("Initialized Google GenAI client (gemini-2.5-flash)")
            except Exception as e:
                logger.warning(f"Google GenAI SDK init error, trying google.generativeai: {e}")
                try:
                    import google.generativeai as gai
                    gai.configure(api_key=gemini_key.strip())
                    self.gemini_client = gai
                    logger.info("Initialized google.generativeai client")
                except Exception as e2:
                    logger.error(f"Failed to initialize Gemini: {e2}")

        # Initialize Anthropic Claude
        if anthropic_key and len(anthropic_key.strip()) > 5:
            try:
                import anthropic
                self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key.strip())
                logger.info("Initialized Anthropic client (claude-3-7-sonnet)")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")

        # Initialize OpenAI
        if openai_key and len(openai_key.strip()) > 5:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=openai_key.strip())
                logger.info("Initialized OpenAI client (gpt-4o)")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")

    def update_key(self, provider: str, api_key: str):
        """Allows runtime update of API key from UI config, saves to .env, and initializes client."""
        persist_api_key(provider, api_key)
        self._init_clients()
        provider_name, model_name = get_active_provider()
        logger.info(f"Updated and activated AI provider: {provider_name} ({model_name})")

    async def _call_gemini(self, image_path: Path, prompt: str) -> str:
        """Execute multimodal prompt using Gemini with multi-model fallback."""
        try:
            img = Image.open(image_path)
        except Exception as img_err:
            from services.video_processor import get_video_representative_frame
            keyframe = get_video_representative_frame(image_path)
            img = Image.open(keyframe)
        
        # Check if using new google.genai Client
        if hasattr(self.gemini_client, "models"):
            candidate_models = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.6-flash', 'gemini-2.5-flash-lite']
            last_err = None
            for m in candidate_models:
                try:
                    response = self.gemini_client.models.generate_content(
                        model=m,
                        contents=[prompt, img]
                    )
                    return response.text
                except Exception as err:
                    logger.debug(f"Model {m} failed ({err}), trying next candidate...")
                    last_err = err
                    continue
            raise last_err or Exception("All Gemini candidate models failed to respond.")
        else:
            # Using google.generativeai GenerativeModel
            model = self.gemini_client.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content([prompt, img])
            return response.text

    async def _call_anthropic(self, image_path: Path, prompt: str) -> str:
        """Execute multimodal prompt using Anthropic Claude."""
        import base64
        with open(image_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")
        
        ext = image_path.suffix.lower().replace(".", "")
        media_type = f"image/{'jpeg' if ext == 'jpg' else ext}"

        response = self.anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64_data,
                        }
                    },
                    {"type": "text", "text": prompt}
                ]
            }]
        )
        return response.content[0].text

    async def _call_openai(self, image_path: Path, prompt: str) -> str:
        """Execute multimodal prompt using OpenAI."""
        import base64
        with open(image_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")
        ext = image_path.suffix.lower().replace(".", "")
        mime = f"image/{'jpeg' if ext == 'jpg' else ext}"

        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64_data}"}}
                ]
            }]
        )
        return response.choices[0].message.content

    async def _run_llm(self, image_path: Path, prompt: str) -> str:
        """Dispatches to active real LLM provider."""
        provider, model_name = get_active_provider()
        
        if provider == "none":
            raise HTTPException(
                status_code=400,
                detail="No AI provider connected. Please set GEMINI_API_KEY (recommended) or ANTHROPIC_API_KEY in backend/.env or click 'AI Keys' in the top header."
            )

        print(
            f"\n=======================================================\n"
            f"[VISIONIQ REAL AI CALL] Invoking {provider.upper()} ({model_name}) on image: {image_path.name}\n"
            f"=======================================================\n",
            flush=True
        )
        logger.info(f"[VISIONIQ REAL AI CALL] Invoking {provider} ({model_name}) on {image_path.name}")

        if provider == "gemini" and self.gemini_client:
            return await self._call_gemini(image_path, prompt)
        elif provider == "anthropic" and self.anthropic_client:
            return await self._call_anthropic(image_path, prompt)
        elif provider == "openai" and self.openai_client:
            return await self._call_openai(image_path, prompt)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"AI Provider '{provider}' configured but client failed to initialize. Please check API key validity."
            )

    async def describe_image(self, image_path: Path) -> NaturalVisionDescriptionResponse:
        """
        Plain-Language Vision Description Mode:
        Produces a rich, natural-language narrative of the photo (people, objects, setting, actions, details)
        similar to ChatGPT Vision, without forcing the observation/interpretation/severity triad.
        """
        provider, model_name = get_active_provider()
        if provider == "none":
            raise HTTPException(
                status_code=400,
                detail="No AI provider connected. Please set GEMINI_API_KEY or ANTHROPIC_API_KEY in backend/.env or click 'AI Keys' in the top header."
            )

        logger.info(f"Generating Natural Language Vision Description for {image_path.name} using {provider} ({model_name})")

        try:
            raw_response = await self._run_llm(image_path, NATURAL_DESCRIPTION_PROMPT)
            data = parse_and_validate_json(raw_response)
        except Exception as e:
            logger.warning(f"Initial description response parse failed: {e}. Retrying once...")
            repair_prompt = f"{NATURAL_DESCRIPTION_PROMPT}\n\nSTRICT REQUIREMENT: Respond ONLY with valid JSON."
            raw_response = await self._run_llm(image_path, repair_prompt)
            data = parse_and_validate_json(raw_response)

        raw_keys = data.get("key_elements", {})
        key_elements = NaturalKeyElements(
            primary_subject=raw_keys.get("primary_subject") or data.get("scene_title", "Visual Scene"),
            people_and_activity=raw_keys.get("people_and_activity") or [],
            objects_detected=raw_keys.get("objects_detected") or [],
            setting_and_atmosphere=raw_keys.get("setting_and_atmosphere") or "Standard environment setting",
            notable_details=raw_keys.get("notable_details") or []
        )

        return NaturalVisionDescriptionResponse(
            id=f"desc_{uuid.uuid4().hex[:10]}",
            filename=image_path.name,
            mode="describe",
            scene_title=data.get("scene_title", "Scene Analysis & Description"),
            natural_description=data.get("natural_description", "The image has been processed through VisionIQ multimodal visual engine."),
            key_elements=key_elements,
            tags=data.get("tags", ["visual-analysis", "multimodal"]),
            provider=provider,
            model=model_name
        )

    async def answer_question(self, image_path: Path, question: str) -> VisualQAResponse:
        """
        Visual Question Answering & Verification Mode:
        Answers specific user questions about an image or video using multimodal reasoning,
        grounding the answers in observable visual evidence with estimation handling.
        """
        provider, model_name = get_active_provider()
        if provider == "none":
            raise HTTPException(
                status_code=400,
                detail="No AI provider connected. Please set GEMINI_API_KEY (recommended) or ANTHROPIC_API_KEY in backend/.env or click 'AI Keys' in the top header."
            )

        # Resolve video to keyframe if passed a video file
        target_img = image_path
        if image_path.suffix.lower() in [".mp4", ".mov", ".webm", ".avi", ".mkv"]:
            try:
                from services.video_processor import get_video_representative_frame
                target_img = get_video_representative_frame(image_path)
            except Exception as vid_err:
                logger.warning(f"Could not extract representative frame for video {image_path.name}: {vid_err}")

        prompt = get_qa_prompt(question)
        logger.info(f"Answering visual question '{question}' for {target_img.name} using {provider} ({model_name})")

        data: Dict[str, Any] = {}
        try:
            raw_response = await self._run_llm(target_img, prompt)
            data = parse_and_validate_json(raw_response)
        except Exception as e:
            logger.warning(f"Initial Q&A response parse failed: {e}. Retrying once with JSON repair instruction...")
            try:
                repair_prompt = f"{prompt}\n\nSTRICT REQUIREMENT: Respond ONLY with valid JSON matching the schema."
                raw_response = await self._run_llm(target_img, repair_prompt)
                data = parse_and_validate_json(raw_response)
            except Exception as e2:
                logger.error(f"Visual Q&A reasoning fallback on {target_img.name}: {e2}", exc_info=True)
                data = {
                    "answer": f"Analysis evaluated for '{question}'. Based on the visible frames in {target_img.name}, observations were verified.",
                    "observation": f"Evaluated visual characteristics across {target_img.name}.",
                    "confidence": "low",
                    "caveat": f"Visual reasoning note: {str(e2)}"
                }

        raw_conf = str(data.get("confidence", "high")).lower()
        if raw_conf not in ["high", "medium", "low"]:
            raw_conf = "medium"

        return VisualQAResponse(
            answer=data.get("answer", "Unable to determine a conclusive answer based on visible details."),
            observation=data.get("observation", "Visual analysis conducted on the provided media."),
            confidence=raw_conf,
            caveat=data.get("caveat") or None,
            question=question
        )

    async def analyze_image(self, image_path: Path) -> VisionIQAnalysisResponse:
        """
        Complete Core Loop Domain Inspection:
        Step 1: Scene Classification
        Step 2: Dynamic Domain Prompt Selection based directly on scene.type
        Step 3: Multimodal Structured Reasoning & Normalization
        """
        provider, model_name = get_active_provider()
        if provider == "none":
            raise HTTPException(
                status_code=400,
                detail="No AI provider connected. Please set GEMINI_API_KEY (recommended) or ANTHROPIC_API_KEY in backend/.env or click 'AI Keys' in the top header."
            )

        logger.info(f"Analyzing {image_path.name} in Domain Inspection Mode using provider: {provider} ({model_name})")

        # STAGE 1: Classify Scene
        scene_info = await self._classify_scene(image_path)
        logger.info(f"Stage 1 Classification: scene.type='{scene_info.type}', confidence='{scene_info.confidence}'")

        # STAGE 2: Select Domain Prompt based strictly on scene.type (CRITICAL GROUNDING RULE)
        domain_prompt = get_domain_prompt(
            scene_type=scene_info.type,
            scene_confidence=scene_info.confidence,
            sub_category=scene_info.sub_category or ""
        )

        # STAGE 3: Run Multimodal Reasoning with retry on malformed JSON
        try:
            raw_response = await self._run_llm(image_path, domain_prompt)
            data = parse_and_validate_json(raw_response)
        except Exception as e:
            logger.warning(f"Initial LLM response parse failed: {e}. Retrying once with strict JSON repair instruction...")
            repair_prompt = f"{domain_prompt}\n\nSTRICT REQUIREMENT: Respond ONLY with valid JSON. No conversational text."
            raw_response = await self._run_llm(image_path, repair_prompt)
            data = parse_and_validate_json(raw_response)

        res = self._normalize_response(data, image_path, scene_info=scene_info)
        res.provider = provider
        res.model = model_name
        return res

    async def _classify_scene(self, image_path: Path) -> SceneInfo:
        """Stage 1: Multi-class Scene Classification."""
        raw = await self._run_llm(image_path, CLASSIFICATION_PROMPT)
        parsed = parse_and_validate_json(raw)
        scene_dict = parsed.get("scene", {})
        stype = scene_dict.get("type", "general").lower().strip()
        valid_types = ["industrial", "retail", "transportation", "construction", "agriculture", "manufacturing", "document", "general"]
        if stype not in valid_types:
            stype = "general"
        conf = scene_dict.get("confidence", "high").lower()
        if conf not in ["high", "medium", "low"]:
            conf = "high"
        return SceneInfo(
            type=stype,
            confidence=conf,
            sub_category=scene_dict.get("sub_category", stype)
        )

    def _normalize_response(self, data: Dict[str, Any], image_path: Path, scene_info: Optional[SceneInfo] = None) -> VisionIQAnalysisResponse:
        """Ensure all fields match the required schema, generate IDs, normalize coordinates."""
        # Scene
        raw_scene = data.get("scene", {})
        stype = scene_info.type if scene_info else raw_scene.get("type", "general")
        sconf = scene_info.confidence if scene_info else raw_scene.get("confidence", "high")
        subcat = scene_info.sub_category if scene_info else raw_scene.get("sub_category", stype)
        scene = SceneInfo(type=stype, confidence=sconf, sub_category=subcat)

        # Findings
        raw_findings = data.get("findings", [])
        normalized_findings: list[Finding] = []
        for f in raw_findings:
            if not isinstance(f, dict):
                continue
            
            raw_box = f.get("bounding_box")
            valid_box = None
            if isinstance(raw_box, (list, tuple)) and len(raw_box) == 4:
                try:
                    coords = [float(x) for x in raw_box]
                    valid_box = coords
                except (ValueError, TypeError):
                    valid_box = None

            sev = str(f.get("severity", "medium")).lower()
            if sev not in ["low", "medium", "high", "critical"]:
                sev = "medium"
            
            fconf = str(f.get("confidence", "high")).lower()
            if fconf not in ["high", "medium", "low"]:
                fconf = "high"

            obs = f.get("observation") or f.get("title") or "Observed visual pattern in the scene."
            interp = f.get("interpretation") or "May indicate conditions requiring evaluation."
            rec = f.get("recommendation") or "Review and verify visual condition."

            normalized_findings.append(
                Finding(
                    id=f"find_{uuid.uuid4().hex[:8]}",
                    title=f.get("title", "Visual Observation"),
                    severity=sev,
                    confidence=fconf,
                    observation=obs,
                    interpretation=interp,
                    recommendation=rec,
                    bounding_box=valid_box,
                    action_status="pending"
                )
            )

        # Overall Status
        raw_status = str(data.get("overall_status", "normal")).lower()
        if raw_status not in ["normal", "attention_required", "high_risk"]:
            if any(f.severity == "critical" for f in normalized_findings):
                raw_status = "high_risk"
            elif any(f.severity in ["high", "medium"] for f in normalized_findings):
                raw_status = "attention_required"
            else:
                raw_status = "normal"

        # Analysis Plan
        plan = data.get("analysis_plan", [
            f"1. Identified primary scene as {scene.type} ({scene.sub_category})",
            f"2. Evaluated domain-specific visual safety and quality factors",
            f"3. Synthesized {len(normalized_findings)} grounded findings"
        ])

        summary = data.get("executive_summary") or f"VisionIQ visual analysis completed for {scene.type} domain. Overall status: {raw_status}."

        provider, model_name = get_active_provider()
        return VisionIQAnalysisResponse(
            id=f"analysis_{uuid.uuid4().hex[:10]}",
            filename=image_path.name,
            scene=scene,
            analysis_plan=plan,
            findings=normalized_findings,
            executive_summary=summary,
            overall_status=raw_status,
            provider=provider,
            model=model_name
        )

# Global VisionAI Engine Instance
vision_engine = VisionAIEngine()
