import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000"

def run_test():
    print("==================================================")
    print("PHASE 1 CORE LOOP & GROUNDING VERIFICATION TEST")
    print("==================================================")

    # 1. Test Samples List
    print("\n[TEST 1] Fetching Bundled Samples...")
    req = urllib.request.Request(f"{BASE_URL}/api/samples")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        samples_data = json.loads(resp.read().decode())
        samples = samples_data.get("samples", [])
        print(f"Found {len(samples)} bundled samples.")
        assert len(samples) >= 3

    # 2. Test Factory Safety (Industrial Domain)
    print("\n[TEST 2] Analyzing Factory Safety Demo Sample...")
    req = urllib.request.Request(f"{BASE_URL}/api/analyze/sample/factory_safety", data=b"", method="POST")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        factory_res = json.loads(resp.read().decode())
        print(f"Scene Type: {factory_res['scene']['type']} (confidence: {factory_res['scene']['confidence']})")
        print(f"Overall Status: {factory_res['overall_status']}")
        print(f"Findings Count: {len(factory_res['findings'])}")
        assert factory_res["scene"]["type"] == "industrial"
        assert len(factory_res["findings"]) >= 1
        for f in factory_res["findings"]:
            print(f"  - Title: {f['title']}")
            print(f"    Observation: {f['observation']}")
            print(f"    Interpretation: {f['interpretation']}")
            print(f"    Recommendation: {f['recommendation']}")
            print(f"    Severity: {f['severity']}, Box: {f.get('bounding_box')}")
            assert f["observation"] and len(f["observation"]) > 5
            assert f["interpretation"] and len(f["interpretation"]) > 5
            assert f["recommendation"] and len(f["recommendation"]) > 5

    # 3. Test Road Defect (Transportation Domain)
    print("\n[TEST 3] Analyzing Road Defect Demo Sample...")
    req = urllib.request.Request(f"{BASE_URL}/api/analyze/sample/road_defect", data=b"", method="POST")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        road_res = json.loads(resp.read().decode())
        print(f"Scene Type: {road_res['scene']['type']} (confidence: {road_res['scene']['confidence']})")
        print(f"Overall Status: {road_res['overall_status']}")
        print(f"Findings Count: {len(road_res['findings'])}")
        assert road_res["scene"]["type"] == "transportation"
        assert len(road_res["findings"]) >= 1
        for f in road_res["findings"]:
            print(f"  - Title: {f['title']}")
            print(f"    Observation: {f['observation']}")
            print(f"    Interpretation: {f['interpretation']}")
            print(f"    Recommendation: {f['recommendation']}")
            assert f["observation"] and len(f["observation"]) > 5
            assert f["interpretation"] and len(f["interpretation"]) > 5
            assert f["recommendation"] and len(f["recommendation"]) > 5

    # 4. CRITICAL GROUNDING CHECK: Indoor Domestic Room
    print("\n[TEST 4] CRITICAL GROUNDING CHECK: Analyzing Indoor Room Sample...")
    req = urllib.request.Request(f"{BASE_URL}/api/analyze/sample/indoor_room", data=b"", method="POST")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        room_res = json.loads(resp.read().decode())
        scene_type = room_res["scene"]["type"]
        print(f"Scene Type: {scene_type} (confidence: {room_res['scene']['confidence']})")
        print(f"Overall Status: {room_res['overall_status']}")
        print(f"Findings Count: {len(room_res['findings'])}")

        # Verification 1: Must NOT be forced into industrial or transportation
        print("\nChecking Grounding Rule 1: Not forced into industrial or transportation...")
        assert scene_type not in ["industrial", "transportation"], f"FAILED: Indoor room was misclassified as {scene_type}!"
        print(f"PASS: Scene classified as '{scene_type}' (not industrial/transportation).")

        # Verification 2: Findings describe actual interior/general elements, not factory/pothole text
        print("Checking Grounding Rule 2: Grounded findings...")
        for f in room_res["findings"]:
            print(f"  - Title: {f['title']}")
            print(f"    Observation: {f['observation']}")
            print(f"    Interpretation: {f['interpretation']}")
            print(f"    Recommendation: {f['recommendation']}")
            # Must not contain fabricated road/factory terms
            lower_text = (f["title"] + " " + f["observation"] + " " + f["interpretation"]).lower()
            assert "pothole" not in lower_text, "FAILED: Pothole mentioned in living room!"
            assert "conveyor" not in lower_text, "FAILED: Conveyor mentioned in living room!"
            assert "asphalt" not in lower_text, "FAILED: Asphalt mentioned in living room!"

    # 5. History persistence verification
    print("\n[TEST 5] Verifying SQLite History...")
    req = urllib.request.Request(f"{BASE_URL}/api/history")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        history_data = json.loads(resp.read().decode())
        history = history_data.get("history", [])
        print(f"History entries recorded: {len(history)}")
        assert len(history) >= 3

    print("\n==================================================")
    print("ALL PHASE 1 CORE LOOP & GROUNDING TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"\nTEST FAILED WITH ERROR: {e}")
        sys.exit(1)
