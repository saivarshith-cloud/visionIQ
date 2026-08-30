import requests
import json
import sys
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
SAMPLES_DIR = Path(__file__).resolve().parent.parent / "storage" / "samples"
VIDEO_SAMPLE = SAMPLES_DIR / "factory_demo.mp4"

def run_tests():
    print("=" * 60)
    print("TESTING VIDEO UPLOAD, ERROR HANDLING & FOLLOW-UP Q&A")
    print("=" * 60)

    # 1. Health check
    print("\n[STEP 1] Checking server health...")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print(f"Health Status: {r.json().get('status')} | Provider: {r.json().get('provider')}")

    # 2. Upload real video file
    print(f"\n[STEP 2] Uploading and analyzing real video: {VIDEO_SAMPLE.name}...")
    assert VIDEO_SAMPLE.exists(), f"Video sample not found at {VIDEO_SAMPLE}"
    
    with open(VIDEO_SAMPLE, "rb") as f:
        files = {"file": (VIDEO_SAMPLE.name, f, "video/mp4")}
        r = requests.post(f"{BASE_URL}/api/analyze/video", files=files, timeout=60)
    
    print(f"Status Code: {r.status_code}")
    assert r.status_code == 200, f"Video analysis failed with {r.status_code}: {r.text}"
    video_res = r.json()
    
    print(f"Scene Type: {video_res.get('scene', {}).get('type')}")
    print(f"Overall Status: {video_res.get('overall_status')}")
    print(f"Executive Summary: {video_res.get('executive_summary')}")
    print(f"Keyframes Sampled: {len(video_res.get('metadata', {}).get('video_timeline', []))}")
    print(f"Total Findings Detected across timeline: {len(video_res.get('findings', []))}")
    for idx, f in enumerate(video_res.get('findings', [])[:3]):
        print(f"  Finding #{idx+1}: {f.get('title')} (Severity: {f.get('severity')})")

    uploaded_video_url = video_res.get("media_url")
    print(f"Uploaded Media URL: {uploaded_video_url}")

    # 3. Ask a follow-up question on the uploaded video
    print(f"\n[STEP 3] Asking follow-up question on the uploaded video: 'What hazards or cargo movements are visible?'")
    qa_payload = {
        "media_url": uploaded_video_url,
        "question": "What hazards or cargo movements are visible across the video duration?"
    }
    qa_resp = requests.post(f"{BASE_URL}/api/qa", json=qa_payload, timeout=60)
    print(f"Q&A Status Code: {qa_resp.status_code}")
    assert qa_resp.status_code == 200, f"Q&A on video failed: {qa_resp.text}"
    qa_data = qa_resp.json()
    print(f"\n[Q&A ANSWER]:\n{qa_data.get('answer')}")
    print(f"\n[VISUAL OBSERVATION]:\n{qa_data.get('observation')}")
    print(f"\n[CONFIDENCE]: {qa_data.get('confidence')}")
    if qa_data.get('caveat'):
        print(f"[CAVEAT]: {qa_data.get('caveat')}")

    # 4. Graceful handling of invalid video upload
    print("\n[STEP 4] Testing graceful failure on invalid/corrupt video file...")
    corrupt_bytes = b"NOT_A_REAL_MP4_HEADER_CORRUPT_DATA"
    files = {"file": ("corrupt_test.mp4", corrupt_bytes, "video/mp4")}
    r_corrupt = requests.post(f"{BASE_URL}/api/analyze/video", files=files, timeout=30)
    print(f"Corrupt video response status code: {r_corrupt.status_code}")
    print(f"Corrupt video error response detail: {r_corrupt.json().get('detail')}")
    assert r_corrupt.status_code in [400, 500], "Expected 400 or 500 error code for corrupt video"

    # 5. Confirm server is STILL ALIVE and can answer further questions immediately
    print("\n[STEP 5] Verifying server is still responsive and healthy after tests...")
    r_health2 = requests.get(f"{BASE_URL}/api/health")
    assert r_health2.status_code == 200, "Server crashed or is unresponsive after error test!"
    print(f"Server Health: {r_health2.json().get('status')} - Server remains 100% online!")

    print("\n" + "=" * 60)
    print("ALL VIDEO AND Q&A ERROR HANDLING TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
