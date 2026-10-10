import pytest
from geospatial.validation.emsr927_comparator import EMSR927Comparator
from app.services.pipeline_runner import PipelineRunner

def test_emsr927_independent_comparison():
    bbox = [85.15, 27.90, 85.35, 28.18]
    # Run pipeline to get frozen prediction
    result = PipelineRunner.execute_analysis("test_job_emsr", {"bbox": bbox, "event_date": "2026-08-26"})
    
    # Compare with EMSR927
    comp_res = EMSR927Comparator.compare_with_prediction(result["flood_geojson"], bbox)
    
    metrics = comp_res["comparison_metrics"]
    assert "iou_jaccard" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert comp_res["compliance_certification"] != ""
    assert "European Union" in comp_res["attribution"]
