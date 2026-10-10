import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_create_analysis_job_and_results():
    payload = {
        "name": "Trishuli Valley GLOF Assessment",
        "bbox": [85.15, 27.90, 85.35, 28.18],
        "event_date": "2026-08-26",
        "pre_window_days": 15,
        "post_window_days": 15,
        "slope_threshold_deg": 15.0
    }
    
    # 1. Create analysis
    post_resp = client.post("/api/v1/analyses", json=payload)
    assert post_resp.status_code == 200
    job_info = post_resp.json()
    job_id = job_info["job_id"]
    assert job_id.startswith("job_")
    
    # 2. Get results
    res_resp = client.get(f"/api/v1/analyses/{job_id}/results")
    assert res_resp.status_code == 200
    res_data = res_resp.json()
    assert res_data["total_flood_area_km2"] > 0.0
    assert "settlements" in res_data
    assert "infrastructure" in res_data
    assert len(res_data["attributions"]) >= 3
    
    # 3. Get layers
    layers_resp = client.get(f"/api/v1/analyses/{job_id}/layers")
    assert layers_resp.status_code == 200
    layers = layers_resp.json()
    assert "flood_extent" in layers
    assert "exposed_roads" in layers
    assert "flow_path" in layers
    
    # 4. Ask Copilot (English)
    copilot_query_en = {"question": "Which settlements are cut off?", "language": "en"}
    copilot_resp_en = client.post(f"/api/v1/analyses/{job_id}/copilot", json=copilot_query_en)
    assert copilot_resp_en.status_code == 200
    ans_en = copilot_resp_en.json()
    assert "settlements" in ans_en["answer"].lower()
    
    # 5. Ask Copilot (Nepali)
    copilot_query_ne = {"question": "कुन कुन बस्तीहरू सम्पर्कविहीन भएका छन्?", "language": "ne"}
    copilot_resp_ne = client.post(f"/api/v1/analyses/{job_id}/copilot", json=copilot_query_ne)
    assert copilot_resp_ne.status_code == 200
    ans_ne = copilot_resp_ne.json()
    assert len(ans_ne["answer"]) > 10
    
    # 6. Verify PDF download
    pdf_resp = client.get(f"/api/v1/analyses/{job_id}/report.pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000 # Valid non-empty PDF binary
