import os
import subprocess
import json
import logging
import uuid
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional

import cv2
from config import FRAMES_DIR

logger = logging.getLogger("visioniq.video")

def get_video_duration(video_path: Path) -> float:
    """Use ffprobe or OpenCV to probe video duration in seconds."""
    # 1. Try ffprobe if available
    ffprobe_exe = shutil.which("ffprobe")
    if ffprobe_exe:
        cmd = [
            ffprobe_exe, "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)
        ]
        try:
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
            if result.returncode == 0 and result.stdout.strip():
                dur = float(result.stdout.strip())
                if dur > 0:
                    return dur
        except Exception as e:
            logger.debug(f"ffprobe probe failed: {e}")

    # 2. Fall back to OpenCV
    try:
        cap = cv2.VideoCapture(str(video_path))
        if cap.isOpened():
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
            cap.release()
            if fps > 0 and total_frames > 0:
                return float(total_frames / fps)
    except Exception as e:
        logger.debug(f"OpenCV duration probe failed: {e}")

    logger.warning(f"Could not accurately determine duration for {video_path.name}, using default 10.0s")
    return 10.0

def _extract_with_opencv(video_path: Path, output_dir: Path, max_frames: int = 4, interval_sec: float = 2.5) -> List[Dict[str, Any]]:
    """Fallback frame extraction using OpenCV when FFmpeg is unavailable or errors."""
    logger.info(f"Extracting keyframes via OpenCV fallback from {video_path.name}...")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"OpenCV could not open video file '{video_path.name}'")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration = total_frames / fps if total_frames > 0 and fps > 0 else 10.0

    actual_interval = max(interval_sec, duration / max(1, max_frames)) if duration > 0 else interval_sec
    step_frames = max(1, int(fps * actual_interval))

    extracted_frames = []
    frame_idx = 0
    saved_count = 0

    while cap.isOpened() and saved_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % step_frames == 0:
            saved_count += 1
            fpath = output_dir / f"frame_{saved_count:03d}.jpg"
            cv2.imwrite(str(fpath), frame, [cv2.IMWRITE_JPEG_QUALITY, 88])
            
            timestamp = frame_idx / fps
            extracted_frames.append({
                "frame_index": saved_count - 1,
                "timestamp": round(timestamp, 2),
                "timestamp_str": f"{int(timestamp // 60):02d}:{int(timestamp % 60):02d}",
                "file_path": str(fpath),
                "filename": fpath.name
            })

        frame_idx += 1

    cap.release()
    logger.info(f"OpenCV extracted {len(extracted_frames)} keyframes")
    return extracted_frames

def extract_keyframes(video_path: Path, output_dir: Path, max_frames: int = 4, interval_sec: float = 2.5) -> List[Dict[str, Any]]:
    """
    Extracts keyframes using FFmpeg with automatic OpenCV fallback.
    Guarantees non-crashing execution and clean error handling.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    duration = get_video_duration(video_path)
    
    if duration > 0:
        actual_interval = max(interval_sec, duration / max(1, max_frames))
    else:
        actual_interval = interval_sec

    ffmpeg_exe = shutil.which("ffmpeg")
    extracted_frames: List[Dict[str, Any]] = []

    # Attempt 1: FFmpeg
    if ffmpeg_exe:
        fps_filter = f"fps=1/{actual_interval}"
        output_pattern = str(output_dir / "frame_%03d.jpg")

        cmd = [
            ffmpeg_exe, "-y", "-i", str(video_path),
            "-vf", fps_filter,
            "-vframes", str(max_frames),
            "-q:v", "3",
            output_pattern
        ]

        try:
            logger.info(f"Extracting frames with FFmpeg: {' '.join(cmd)}")
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
            if res.returncode == 0:
                frame_files = sorted(list(output_dir.glob("frame_*.jpg")))
                for idx, fpath in enumerate(frame_files):
                    timestamp = idx * actual_interval
                    extracted_frames.append({
                        "frame_index": idx,
                        "timestamp": round(timestamp, 2),
                        "timestamp_str": f"{int(timestamp // 60):02d}:{int(timestamp % 60):02d}",
                        "file_path": str(fpath),
                        "filename": fpath.name
                    })
        except Exception as e:
            logger.warning(f"FFmpeg execution failed or timed out ({e}). Falling back to OpenCV...")

    # Attempt 2: OpenCV fallback if FFmpeg produced no frames
    if not extracted_frames:
        try:
            extracted_frames = _extract_with_opencv(video_path, output_dir, max_frames=max_frames, interval_sec=actual_interval)
        except Exception as cv_err:
            logger.error(f"OpenCV frame extraction also failed: {cv_err}")

    if not extracted_frames:
        raise ValueError(
            f"Failed to extract any valid video frames from '{video_path.name}'. "
            "Please ensure the file is an uncorrupted MP4, MOV, or WEBM video."
        )

    logger.info(f"Successfully prepared {len(extracted_frames)} keyframes from {video_path.name}")
    return extracted_frames

def get_video_representative_frame(video_path: Path) -> Path:
    """
    Returns a valid JPEG image path representing the video (for Q&A, previews, and single-image reasoning).
    """
    video_id = video_path.stem
    frame_dir = FRAMES_DIR / video_id

    # If keyframes already exist in storage
    if frame_dir.exists():
        frames = sorted(list(frame_dir.glob("frame_*.jpg")))
        if frames:
            # Pick middle frame or first frame
            mid_idx = len(frames) // 2
            return frames[mid_idx]

    # Extract fresh representative frame
    extracted = extract_keyframes(video_path, frame_dir, max_frames=2, interval_sec=1.0)
    return Path(extracted[0]["file_path"])

