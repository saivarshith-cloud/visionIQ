import urllib.request
import urllib.parse
import json
import sys
from pathlib import Path

BASE_URL = "http://localhost:8000"

def post_json(url: str, payload: dict):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def post_empty(url: str):
    req = urllib.request.Request(url, data=b"", method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("=" * 70)
    print("AUTOMATIC DETECTION & VISUAL Q&A END-TO-END VERIFICATION")
    print("=" * 70)

    # ---------------------------------------------------------
    # TEST 1: WAREHOUSE / SHELF PHOTO
    # ---------------------------------------------------------
    print("\n" + "#" * 60)
    print("[TEST 1] WAREHOUSE SHELF PHOTO - AUTOMATIC FINDINGS & Q&A")
    print("#" * 60)

    # 1A. Automatic Findings Detection on Warehouse Photo
    print("\n--- [1A] Running Automatic Findings Detection ---")
    warehouse_analysis = post_empty(f"{BASE_URL}/api/analyze/sample/warehouse_shelf")
    
    print(f"\n[SCENE]: {json.dumps(warehouse_analysis['scene'], indent=2)}")
    print(f"\n[EXECUTIVE SUMMARY]: {warehouse_analysis['executive_summary']}")
    print(f"\n[FINDINGS DETECTED] ({len(warehouse_analysis['findings'])} findings):")
    for idx, f in enumerate(warehouse_analysis['findings'], 1):
        print(f"\nFinding #{idx}: {f['title']}")
        print(f"  Severity:       {f['severity'].upper()}")
        print(f"  Confidence:     {f['confidence'].upper()}")
        print(f"  Observation:    {f['observation']}")
        print(f"  Interpretation: {f['interpretation']}")
        print(f"  Recommendation: {f['recommendation']}")
        if f.get('bounding_box'):
            print(f"  Bounding Box:   {f['bounding_box']}")

    # 1B. Visual Q&A on Warehouse Photo
    warehouse_q = "How many items or boxes on the bottom shelf rack need restocking or are low in inventory?"
    print(f"\n--- [1B] Asking Follow-Up Question: '{warehouse_q}' ---")
    
    warehouse_qa_resp = post_json(f"{BASE_URL}/api/qa", {
        "sample_id": "warehouse_shelf",
        "question": warehouse_q
    })

    print(f"\n[Q&A ANSWER]:\n{warehouse_qa_resp['answer']}")
    print(f"\n[VISUAL OBSERVATION]:\n{warehouse_qa_resp['observation']}")
    print(f"\n[CONFIDENCE]: {warehouse_qa_resp['confidence'].upper()}")
    print(f"\n[CAVEAT / ESTIMATION NOTE]:\n{warehouse_qa_resp.get('caveat')}")

    # ---------------------------------------------------------
    # TEST 2: PARKING LOT PHOTO
    # ---------------------------------------------------------
    print("\n\n" + "#" * 60)
    print("[TEST 2] PARKING LOT PHOTO - AUTOMATIC FINDINGS & Q&A")
    print("#" * 60)

    # 2A. Automatic Findings Detection on Parking Lot Photo
    print("\n--- [2A] Running Automatic Findings Detection ---")
    parking_analysis = post_empty(f"{BASE_URL}/api/analyze/sample/parking_lot")
    
    print(f"\n[SCENE]: {json.dumps(parking_analysis['scene'], indent=2)}")
    print(f"\n[EXECUTIVE SUMMARY]: {parking_analysis['executive_summary']}")
    print(f"\n[FINDINGS DETECTED] ({len(parking_analysis['findings'])} findings):")
    for idx, f in enumerate(parking_analysis['findings'], 1):
        print(f"\nFinding #{idx}: {f['title']}")
        print(f"  Severity:       {f['severity'].upper()}")
        print(f"  Confidence:     {f['confidence'].upper()}")
        print(f"  Observation:    {f['observation']}")
        print(f"  Interpretation: {f['interpretation']}")
        print(f"  Recommendation: {f['recommendation']}")
        if f.get('bounding_box'):
            print(f"  Bounding Box:   {f['bounding_box']}")

    # 2B. Visual Q&A on Parking Lot Photo
    parking_q = "How many parking slots are free vs occupied in the visible area?"
    print(f"\n--- [2B] Asking Follow-Up Question: '{parking_q}' ---")
    
    parking_qa_resp = post_json(f"{BASE_URL}/api/qa", {
        "sample_id": "parking_lot",
        "question": parking_q
    })

    print(f"\n[Q&A ANSWER]:\n{parking_qa_resp['answer']}")
    print(f"\n[VISUAL OBSERVATION]:\n{parking_qa_resp['observation']}")
    print(f"\n[CONFIDENCE]: {parking_qa_resp['confidence'].upper()}")
    print(f"\n[CAVEAT / ESTIMATION NOTE]:\n{parking_qa_resp.get('caveat')}")

    print("\n" + "=" * 70)
    print("END-TO-END VERIFICATION COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
