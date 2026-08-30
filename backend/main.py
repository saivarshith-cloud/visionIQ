import os
import sys
import uuid
import shutil
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any, Literal

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from config import (
    CORS_ORIGINS, PORT, HOST, get_active_provider,
    UPLOADS_DIR, FRAMES_DIR, SAMPLES_DIR, STORAGE_DIR,
    BACKEND_DIR, PROJECT_ROOT
)
from models.schemas import (
    VisionIQAnalysisResponse, Finding, ExplainFindingRequest,
    ExplainFindingResponse, UpdateFindingActionRequest, ApiKeyConfigRequest,
    NaturalVisionDescriptionResponse, VisualQARequest, VisualQAResponse
)
from services.vision_ai import vision_engine
from services.video_processor import extract_keyframes
from services.explainability import explain_finding
import database

# Logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("visioniq")

app = FastAPI(
    title="VisionIQ Backend",
    description="Adaptive Visual Intelligence Engine",
    version="2.0.0"
)

# Robust CORS configuration for dev and production origins (including Vercel previews)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?",
    allow_origins=CORS_ORIGINS + ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler so requests never drop without a response
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {str(exc)}"}
    )

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"}
MAX_IMAGE_SIZE = 25 * 1024 * 1024  # 25 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB

@app.get("/api/health")
async def health_check():
    provider, model = get_active_provider()
    return {
        "status": "ok",
        "app": "VisionIQ",
        "version": "2.0.0",
        "provider": provider,
        "model": model,
        "is_connected": provider != "none"
    }

@app.get("/api/status")
async def get_status():
    provider, model = get_active_provider()
    return {
        "status": "online",
        "provider": provider,
        "model": model,
        "is_connected": provider != "none",
        "configured_cors": CORS_ORIGINS
    }

@app.post("/api/config/key")
async def set_api_key(config: ApiKeyConfigRequest):
    """Dynamically configure API key at runtime and save to backend/.env."""
    key = config.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")

    vision_engine.update_key(config.provider, key)

    # Persist to backend/.env for persistence across restarts
    env_var_map = {
        "gemini": "GEMINI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY"
    }
    target_var = env_var_map.get(config.provider, "GEMINI_API_KEY")

    env_path = BACKEND_DIR / ".env"
    env_lines = []
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            env_lines = f.readlines()

    var_found = False
    new_lines = []
    for line in env_lines:
        if line.startswith(f"{target_var}="):
            new_lines.append(f"{target_var}={key}\n")
            var_found = True
        else:
            new_lines.append(line)

    if not var_found:
        new_lines.append(f"{target_var}={key}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    provider, model = get_active_provider()
    logger.info(f"API key successfully updated and saved for {provider} ({model})")
    return {"status": "success", "provider": provider, "model": model}

SAMPLE_FILE_MAP = {
    "factory_safety": "factory_safety.jpg",
    "road_defect": "road_defect.jpg",
    "indoor_room": "indoor_room.jpg",
    "retail_store": "retail_store.jpg",
    "construction_site": "construction_site.jpg",
    "agriculture_field": "agriculture_field.jpg",
    "manufacturing_assembly": "manufacturing_assembly.jpg",
    "document_invoice": "document_invoice.jpg",
    "warehouse_shelf": "warehouse_shelf.jpg",
    "parking_lot": "parking_lot.jpg"
}

@app.get("/api/samples")
async def list_samples():
    """List bundled demo samples across all domains."""
    sample_definitions = [
        {
            "id": "warehouse_shelf",
            "filename": "warehouse_shelf.jpg",
            "title": "Warehouse Inventory & Pallet Racks",
            "domain": "industrial",
            "description": "Multi-tier warehouse storage racks with boxed inventory, forklift, and restocking areas.",
            "tags": ["Warehouse", "Inventory", "Restocking", "Logistics"]
        },
        {
            "id": "parking_lot",
            "filename": "parking_lot.jpg",
            "title": "Commercial Parking Facility",
            "domain": "transportation",
            "description": "Overhead view of parking lot with vehicle stalls, painted lane markings, and vacant slots.",
            "tags": ["Parking", "Vehicles", "Occupancy", "Traffic"]
        },
        {
            "id": "factory_safety",
            "filename": "factory_safety.jpg",
            "title": "Industrial Factory Floor",
            "domain": "industrial",
            "description": "Factory assembly line with yellow walkway boundary, machinery, and cable hazard.",
            "tags": ["Safety", "PPE", "Trip Hazard", "Machinery"]
        },
        {
            "id": "road_defect",
            "filename": "road_defect.jpg",
            "title": "Highway Pavement Surface",
            "domain": "transportation",
            "description": "Asphalt roadway with center line markings, prominent pothole, and fatigue cracking.",
            "tags": ["Civil", "Pothole", "Pavement", "Road Safety"]
        },
        {
            "id": "indoor_room",
            "filename": "indoor_room.jpg",
            "title": "Residential Living Room",
            "domain": "general",
            "description": "Domestic interior space (couch, coffee table, art) for general description & grounding test.",
            "tags": ["Domestic", "Interior", "General Photo", "Living Space"]
        },
        {
            "id": "retail_store",
            "filename": "retail_store.jpg",
            "title": "Supermarket Grocery Aisles",
            "domain": "retail",
            "description": "Merchandise shelving with stock gaps, price displays, and aisle clearance.",
            "tags": ["Retail", "On-Shelf Availability", "Planogram"]
        },
        {
            "id": "construction_site",
            "filename": "construction_site.jpg",
            "title": "Commercial Construction Framing",
            "domain": "construction",
            "description": "Structural framing with scaffolding, safety barriers, and worker zones.",
            "tags": ["Fall Protection", "Scaffolding", "Site Safety"]
        },
        {
            "id": "agriculture_field",
            "filename": "agriculture_field.jpg",
            "title": "Precision Crop Canopy",
            "domain": "agriculture",
            "description": "Agricultural crop field showing row alignment and localized foliage discoloration.",
            "tags": ["Agronomy", "Crop Health", "Irrigation"]
        },
        {
            "id": "manufacturing_assembly",
            "filename": "manufacturing_assembly.jpg",
            "title": "Precision Electronics Assembly",
            "domain": "manufacturing",
            "description": "High-density PCB with microchip placement, trace routing, and solder joints.",
            "tags": ["Quality Control", "Electronics", "Defect Detection"]
        },
        {
            "id": "document_invoice",
            "filename": "document_invoice.jpg",
            "title": "Commercial Equipment Invoice",
            "domain": "document",
            "description": "Itemized business invoice with line items, tax calculations, and signatures.",
            "tags": ["OCR", "Document Intelligence", "Layout Analysis"]
        }
    ]

    for sample in sample_definitions:
        sample_path = SAMPLES_DIR / sample["filename"]
        sample["available"] = sample_path.exists()
        sample["url"] = f"/api/media/samples/{sample['filename']}"

    return {"samples": sample_definitions}

@app.post("/api/qa", response_model=VisualQAResponse)
async def ask_visual_question(req: VisualQARequest):
    """
    Ask VisionIQ: Visual Question Answering on an active image or video.
    Supports resolving via sample_id, media_url, or media_id.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    target_path = None
    
    # 1. Check sample_id
    if req.sample_id and req.sample_id in SAMPLE_FILE_MAP:
        candidate = SAMPLES_DIR / SAMPLE_FILE_MAP[req.sample_id]
        if candidate.exists():
            target_path = candidate

    # 2. Check media_url
    if not target_path and req.media_url:
        clean_url = req.media_url.replace("/api/media/", "").strip()
        candidate = (STORAGE_DIR / clean_url).resolve()
        if candidate.exists() and candidate.is_file():
            target_path = candidate
        else:
            fname = Path(req.media_url).name
            if (UPLOADS_DIR / fname).exists():
                target_path = UPLOADS_DIR / fname
            elif (SAMPLES_DIR / fname).exists():
                target_path = SAMPLES_DIR / fname

    # 3. Check media_id
    if not target_path and req.media_id:
        fname = Path(req.media_id).name
        if (UPLOADS_DIR / fname).exists():
            target_path = UPLOADS_DIR / fname
        elif (SAMPLES_DIR / fname).exists():
            target_path = SAMPLES_DIR / fname
        elif req.media_id in SAMPLE_FILE_MAP and (SAMPLES_DIR / SAMPLE_FILE_MAP[req.media_id]).exists():
            target_path = SAMPLES_DIR / SAMPLE_FILE_MAP[req.media_id]

    if not target_path or not target_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Target image or video not found for Visual Q&A. Please provide a valid media_url, media_id, or upload media."
        )

    try:
        return await vision_engine.answer_question(target_path, req.question.strip())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Visual Q&A execution error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Visual Q&A error: {str(e)}")

@app.post("/api/qa/image", response_model=VisualQAResponse)
async def ask_visual_question_with_upload(file: UploadFile = File(...), question: str = Form(...)):
    """Ask VisionIQ with direct image upload + question form data."""
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if file.content_type not in ALLOWED_IMAGE_TYPES and file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file.content_type}'. Please upload JPG, PNG, WEBP, or MP4/MOV."
        )

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File exceeds maximum allowed size of 25MB."
        )

    ext = Path(file.filename or "upload.jpg").suffix or ".jpg"
    file_id = f"qa_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = UPLOADS_DIR / file_id

    try:
        with open(dest_path, "wb") as f:
            f.write(contents)

        return await vision_engine.answer_question(dest_path, question.strip())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Visual Q&A upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Visual Q&A error: {str(e)}")

@app.post("/api/describe/image")
async def describe_uploaded_image(file: UploadFile = File(...)):
    """General Vision-Language Description Mode (Plain-English photo narrative)."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file.content_type}'. Please upload JPG, PNG, or WEBP images."
        )

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 25MB."
        )

    ext = Path(file.filename or "upload.jpg").suffix or ".jpg"
    file_id = f"desc_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = UPLOADS_DIR / file_id

    with open(dest_path, "wb") as f:
        f.write(contents)

    response = await vision_engine.describe_image(dest_path)
    response.media_url = f"/api/media/uploads/{file_id}"
    response.filename = file.filename
    return response

@app.post("/api/describe/sample/{sample_id}")
async def describe_sample(sample_id: str):
    """Run general plain-language photo description on a bundled sample image."""
    if sample_id not in SAMPLE_FILE_MAP:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")

    sample_path = SAMPLES_DIR / SAMPLE_FILE_MAP[sample_id]
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail=f"Sample file {sample_path.name} not found on disk.")

    response = await vision_engine.describe_image(sample_path)
    response.media_url = f"/api/media/samples/{sample_path.name}"
    return response

@app.post("/api/analyze/sample/{sample_id}")
async def analyze_sample(sample_id: str, mode: str = Query("inspection")):
    """Run analysis or description on a bundled sample image."""
    if mode == "describe":
        return await describe_sample(sample_id)

    if sample_id not in SAMPLE_FILE_MAP:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")

    sample_path = SAMPLES_DIR / SAMPLE_FILE_MAP[sample_id]
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail=f"Sample file {sample_path.name} not found on disk.")

    response = await vision_engine.analyze_image(sample_path)
    response.media_url = f"/api/media/samples/{sample_path.name}"
    response.media_type = "image"
    
    # Save to SQLite history
    database.save_analysis(response.model_dump(), str(sample_path), "image")
    
    return response

@app.post("/api/analyze/image")
async def analyze_image(file: UploadFile = File(...), mode: str = Query("inspection")):
    """Upload and analyze an image in Domain Inspection mode or Describe mode."""
    if mode == "describe":
        return await describe_uploaded_image(file)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file.content_type}'. Please upload JPG, PNG, or WEBP images."
        )

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 25MB (Current size: {len(contents)/(1024*1024):.1f}MB)."
        )

    ext = Path(file.filename or "upload.jpg").suffix or ".jpg"
    file_id = f"img_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = UPLOADS_DIR / file_id

    with open(dest_path, "wb") as f:
        f.write(contents)

    # Run inspection analysis
    response = await vision_engine.analyze_image(dest_path)
    response.media_url = f"/api/media/uploads/{file_id}"
    response.filename = file.filename
    response.media_type = "image"

    # Save to database
    database.save_analysis(response.model_dump(), str(dest_path), "image")

    return response

@app.post("/api/analyze/video")
async def analyze_video(file: UploadFile = File(...)):
    """Upload and analyze a video file with timeline aggregation and resilient error handling."""
    provider, model_name = get_active_provider()
    if provider == "none":
        raise HTTPException(
            status_code=400,
            detail="No AI provider connected. Please configure GEMINI_API_KEY or ANTHROPIC_API_KEY before analyzing video."
        )

    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format '{file.content_type}'. Please upload MP4, MOV, or WEBM."
        )

    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Video exceeds maximum allowed size of 100MB (Current size: {len(contents)/(1024*1024):.1f}MB)."
        )

    video_id = f"vid_{uuid.uuid4().hex[:12]}"
    ext = Path(file.filename or "video.mp4").suffix or ".mp4"
    video_path = UPLOADS_DIR / f"{video_id}{ext}"

    try:
        with open(video_path, "wb") as f:
            f.write(contents)

        frame_dir = FRAMES_DIR / video_id
        # Sample 3-4 representative keyframes across video duration
        try:
            keyframes = extract_keyframes(video_path, frame_dir, max_frames=4, interval_sec=2.5)
        except Exception as kf_err:
            logger.error(f"Failed to extract video frames for {video_path.name}: {kf_err}", exc_info=True)
            raise HTTPException(
                status_code=400,
                detail=f"Unable to process video frames: {str(kf_err)}"
            )

        if not keyframes:
            raise HTTPException(status_code=400, detail="Failed to extract valid keyframes from video.")

        timeline_events = []
        all_findings: list[Finding] = []
        dominant_scene = None
        highest_severity = "normal"

        for kf in keyframes:
            frame_path = Path(kf["file_path"])
            try:
                frame_res = await vision_engine.analyze_image(frame_path)
            except Exception as frame_err:
                logger.warning(f"Keyframe reasoning skipped on {frame_path.name}: {frame_err}")
                continue
            
            if not dominant_scene:
                dominant_scene = frame_res.scene

            if frame_res.overall_status == "high_risk":
                highest_severity = "high_risk"
            elif frame_res.overall_status == "attention_required" and highest_severity != "high_risk":
                highest_severity = "attention_required"

            for f in frame_res.findings:
                f.title = f"[{kf['timestamp_str']}] {f.title}"
                all_findings.append(f)

            timeline_events.append({
                "frame_index": kf["frame_index"],
                "timestamp": kf["timestamp"],
                "timestamp_str": kf["timestamp_str"],
                "thumbnail_url": f"/api/media/frames/{video_id}/{frame_path.name}",
                "status": frame_res.overall_status,
                "scene_type": frame_res.scene.type,
                "findings_count": len(frame_res.findings),
                "findings": [f.model_dump() for f in frame_res.findings]
            })

        if not timeline_events:
            raise HTTPException(
                status_code=500,
                detail="AI reasoning could not complete on any keyframe from the uploaded video."
            )

        analysis_res = VisionIQAnalysisResponse(
            id=f"analysis_{uuid.uuid4().hex[:10]}",
            filename=file.filename,
            media_url=f"/api/media/uploads/{video_path.name}",
            media_type="video",
            scene=dominant_scene or SceneInfo(type="general", confidence="high"),
            analysis_plan=[
                f"1. Ingested video '{file.filename}'",
                f"2. Extracted {len(keyframes)} keyframes via FFmpeg/OpenCV interval sampling",
                f"3. Executed scene analysis and aggregated findings across {len(timeline_events)} temporal intervals"
            ],
            findings=all_findings,
            executive_summary=f"Analyzed video timeline across {len(timeline_events)} keyframes using {provider} ({model_name}). Highest detected risk state: {highest_severity.upper()}.",
            overall_status=highest_severity,
            provider=provider,
            model=model_name,
            metadata={
                "video_timeline": timeline_events,
                "total_frames_sampled": len(keyframes)
            }
        )

        database.save_analysis(analysis_res.model_dump(), str(video_path), "video")
        return analysis_res
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unhandled video pipeline error on {file.filename}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Video analysis encountered an unexpected processing error: {str(e)}"
        )

@app.post("/api/findings/explain")
async def explain_finding_endpoint(req: ExplainFindingRequest):
    """Deep-dive explainability on a specific finding."""
    image_path = None
    if req.media_id:
        possible_upload = UPLOADS_DIR / req.media_id
        possible_sample = SAMPLES_DIR / req.media_id
        if possible_upload.exists():
            image_path = possible_upload
        elif possible_sample.exists():
            image_path = possible_sample

    return await explain_finding(req.finding, req.scene_type, image_path)

@app.post("/api/findings/{finding_id}/action")
async def update_action(finding_id: str, req: UpdateFindingActionRequest):
    """Update human-in-the-loop action status (confirm / dismiss / escalate)."""
    database.update_finding_action(finding_id, req.analysis_id or "", req.action, req.notes)
    return {"status": "success", "finding_id": finding_id, "action": req.action}

@app.get("/api/history")
async def list_history():
    """Retrieve all past analyses from SQLite."""
    items = database.get_all_analyses()
    return {"history": items}

@app.get("/api/history/{analysis_id}")
async def get_history_detail(analysis_id: str):
    """Retrieve full detail for a past analysis."""
    item = database.get_analysis_by_id(analysis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return item

@app.get("/api/media/{folder:path}")
async def serve_media(folder: str):
    """Safely serve media files from storage."""
    target_file = (STORAGE_DIR / folder).resolve()
    
    if not str(target_file).startswith(str(STORAGE_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(status_code=404, detail=f"Media file '{folder}' not found")

    return FileResponse(target_file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
