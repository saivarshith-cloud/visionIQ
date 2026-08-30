import urllib.request
import json

def test_backend_and_frontend():
    print("Testing Backend Health Check...")
    backend_res = urllib.request.urlopen("http://localhost:8000/api/health")
    assert backend_res.status == 200
    backend_data = json.loads(backend_res.read().decode())
    print("Backend Response:", backend_data)
    assert backend_data.get("status") == "ok"

    print("\nTesting Frontend Serving...")
    frontend_res = urllib.request.urlopen("http://localhost:5173/")
    assert frontend_res.status == 200
    frontend_html = frontend_res.read().decode()
    print(f"Frontend Response OK ({len(frontend_html)} bytes).")
    assert "id=\"root\"" in frontend_html or "div" in frontend_html
    print("Step 0 Check: PASSED successfully!\n")

if __name__ == "__main__":
    test_backend_and_frontend()
