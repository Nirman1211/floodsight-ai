import os
import uuid
import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Dict, Any

from app.schemas.analysis import AnalysisRequest, AnalysisStatus, AnalysisResult, CopilotQuery, CopilotResponse
from app.services.pipeline_runner import PipelineRunner
from app.services.copilot import SituationReportCopilot

router = APIRouter()

# In-memory job repository for fast, reliable demo execution
JOBS_DB: Dict[str, Dict[str, Any]] = {}
RESULTS_DB: Dict[str, Dict[str, Any]] = {}

def run_job_task(job_id: str, request_data: Dict[str, Any]):
    try:
        JOBS_DB[job_id]["status"] = "discovering_data"
        JOBS_DB[job_id]["progress"] = 20
        JOBS_DB[job_id]["message"] = "Querying Sentinel-1 & Sentinel-2 satellite catalogs..."
        
        # Run pipeline
        res = PipelineRunner.execute_analysis(job_id, request_data)
        
        RESULTS_DB[job_id] = res
        JOBS_DB[job_id]["status"] = "completed"
        JOBS_DB[job_id]["progress"] = 100
        JOBS_DB[job_id]["message"] = "Analysis completed successfully. Layers and SitRep ready."
        JOBS_DB[job_id]["completed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    except Exception as e:
        JOBS_DB[job_id]["status"] = "failed"
        JOBS_DB[job_id]["error"] = str(e)
        JOBS_DB[job_id]["message"] = f"Pipeline execution failed: {str(e)}"

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FloodSight AI Backend",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@router.post("/analyses", response_model=AnalysisStatus)
def create_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    status_entry = {
        "job_id": job_id,
        "status": "queued",
        "progress": 5,
        "message": "Analysis job queued for processing",
        "created_at": created_at,
        "completed_at": None,
        "error": None
    }
    
    JOBS_DB[job_id] = status_entry
    # Run synchronously or in background
    run_job_task(job_id, request.model_dump())
    
    return JOBS_DB[job_id]

@router.get("/analyses/{job_id}", response_model=AnalysisStatus)
def get_analysis_status(job_id: str):
    if job_id not in JOBS_DB:
        raise HTTPException(status_code=404, detail="Job ID not found")
    return JOBS_DB[job_id]

@router.get("/analyses/{job_id}/results")
def get_analysis_results(job_id: str):
    if job_id not in RESULTS_DB:
        if job_id in JOBS_DB and JOBS_DB[job_id]["status"] != "completed":
            raise HTTPException(status_code=202, detail=f"Job is currently {JOBS_DB[job_id]['status']}")
        raise HTTPException(status_code=404, detail="Results not found for job")
    return RESULTS_DB[job_id]

@router.get("/analyses/{job_id}/layers")
def get_map_layers(job_id: str):
    if job_id not in RESULTS_DB:
        raise HTTPException(status_code=404, detail="Layers not found")
    res = RESULTS_DB[job_id]
    return {
        "flood_extent": res["flood_geojson"],
        "exposed_roads": res["exposed_roads_geojson"],
        "exposed_buildings": res["exposed_buildings_geojson"],
        "flow_path": res.get("flood_flow_path_geojson"),
        "settlements": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": s["coordinates"]},
                "properties": s
            }
            for s in res["settlements"]
        ]
    }

@router.get("/analyses/{job_id}/report.pdf")
def download_pdf_report(job_id: str):
    if job_id not in RESULTS_DB:
        raise HTTPException(status_code=404, detail="Report not found")
    pdf_path = RESULTS_DB[job_id].get("pdf_report_path")
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF report file does not exist on disk")
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"FloodSight_SitRep_{job_id}.pdf"
    )

@router.post("/analyses/{job_id}/copilot", response_model=CopilotResponse)
def ask_copilot(job_id: str, query: CopilotQuery):
    if job_id not in RESULTS_DB:
        raise HTTPException(status_code=404, detail="Analysis results not found to ground the copilot")
    res = RESULTS_DB[job_id]
    ans = SituationReportCopilot.answer_query(query.question, res, language=query.language)
    return ans
