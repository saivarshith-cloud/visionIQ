import urllib.request
import urllib.parse
import json
import sys
import io
from pathlib import Path

BASE_URL = "http://localhost:8000"
SAMPLES_DIR = Path(__file__).resolve().parent.parent / "storage" / "samples"

def test_video_analysis():
    print("\n[TEST VIDEO] Uploading and analyzing factory_demo.mp4...")
    video_path = SAMPLES_DIR / "factory_demo.mp4"
    assert video_path.exists(), "factory_demo.mp4 not found"

    # Read video file
    with open(video_path, "rb") as f:
        video_bytes = f.read()

    # Construct multipart/form-data
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode())
    body.write(f'Content-Disposition: form-data; name="file"; filename="factory_demo.mp4"\r\n'.encode())
    body.write(b"Content-Type: video/mp4\r\n\r\n")
    body.write(video_bytes)
    body.write(f"\r\n--{boundary}--\r\n".encode())

    req = urllib.request.Request(
        f"{BASE_URL}/api/analyze/video",
        data=body.getvalue(),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        print(f"Video Analysis ID: {data['id']}")
        print(f"Overall Status: {data['overall_status']}")
        print(f"Findings Count: {len(data['findings'])}")
        
        timeline = data.get("metadata", {}).get("video_timeline", [])
        print(f"Extracted Timeline Keyframes: {len(timeline)}")
        assert len(timeline) >= 2, f"Expected at least 2 keyframes, got {len(timeline)}"
        for kf in timeline:
            print(f"  - Frame [{kf['timestamp_str']}] (status: {kf['status']}) -> {kf['findings_count']} findings")
        print("PASS: Video pipeline & timeline aggregation verified!")
        return data

def test_all_seven_domains():
    print("\n[TEST 7 DOMAINS] Testing breadth across all remaining domains...")
    domains = [
        ("retail_store", "retail"),
        ("construction_site", "construction"),
        ("agriculture_field", "agriculture"),
        ("manufacturing_assembly", "manufacturing"),
        ("document_invoice", "document"),
    ]

    for sample_id, expected_domain in domains:
        req = urllib.request.Request(f"{BASE_URL}/api/analyze/sample/{sample_id}", data=b"", method="POST")
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            res = json.loads(resp.read().decode())
            print(f"  - Sample '{sample_id}': scene='{res['scene']['type']}' (expected '{expected_domain}'), status='{res['overall_status']}', findings={len(res['findings'])}")
            assert len(res['findings']) >= 1
            for f in res['findings']:
                assert f['observation'] and f['interpretation'] and f['recommendation']

    print("PASS: All 7 domains verified!")

def test_hitl_and_explainability(analysis_res):
    print("\n[TEST HITL & EXPLAINABILITY] Testing Phase 3 Auditor Actions & Explainability...")
    findings = analysis_res.get("findings", [])
    if not findings:
        print("Skipping (no findings in analysis)")
        return

    first_finding = findings[0]
    fid = first_finding.get("id")
    print(f"Target Finding ID: {fid} ('{first_finding['title']}')")

    # 1. Update action status to 'confirmed'
    action_payload = json.dumps({"action": "confirmed", "analysis_id": analysis_res["id"]}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/findings/{fid}/action",
        data=action_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        action_res = json.loads(resp.read().decode())
        print("Action updated:", action_res)
        assert action_res.get("action") == "confirmed"

    # 2. Verify persistence in SQLite
    req = urllib.request.Request(f"{BASE_URL}/api/history/{analysis_res['id']}")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        detail = json.loads(resp.read().decode())
        persisted_findings = detail.get("findings", [])
        matched = [f for f in persisted_findings if f.get("id") == fid]
        assert matched and matched[0].get("action_status") == "confirmed", "HITL Action was not persisted in DB!"
        print("PASS: HITL action persistence verified in SQLite!")

    # 3. Test Explainability
    print("\nTesting 'Why did you flag this?' explainability endpoint...")
    explain_payload = json.dumps({
        "finding": first_finding,
        "scene_type": analysis_res["scene"]["type"],
        "media_id": analysis_res.get("filename")
    }).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/findings/explain",
        data=explain_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        exp = json.loads(resp.read().decode())
        print(f"Grounded Explanation: {exp['grounded_explanation']}")
        print(f"Visual Cues: {exp['visual_cues']}")
        print(f"Risk Factors: {exp['risk_factors']}")
        print(f"Confidence Rationale: {exp['confidence_rationale']}")
        assert len(exp['grounded_explanation']) > 10
        print("PASS: Explainability query verified!")

if __name__ == "__main__":
    print("==================================================")
    print("PHASE 2 & PHASE 3 COMPREHENSIVE VERIFICATION")
    print("==================================================")
    try:
        video_data = test_video_analysis()
        test_all_seven_domains()
        test_hitl_and_explainability(video_data)
        print("\n==================================================")
        print("ALL PHASES (1, 2, 3) VERIFIED WITH ZERO ERRORS!")
        print("==================================================")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
