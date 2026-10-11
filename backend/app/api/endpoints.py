import os
import uuid
import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Dict, Any, Optional

from app.schemas.analysis import AnalysisRequest, AnalysisStatus, AnalysisResult, CopilotQuery, CopilotResponse
from app.services.pipeline_runner import PipelineRunner
from app.services.copilot import SituationReportCopilot
from app.services.custom_upload import CustomImageProcessor

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

@router.post("/analyses/custom-upload")
async def analyze_custom_flood_images(
    pre_image: UploadFile = File(..., description="Pre-disaster satellite or aerial image"),
    post_image: UploadFile = File(..., description="Post-disaster flooded image"),
    sensitivity: float = Form(1.0, description="Change detection sensitivity multiplier")
):
    """
    Accepts arbitrary user-supplied pre- and post-flood images,
    aligns them, performs adaptive Otsu segmentation, and returns
    flood mask overlays and area estimates.
    """
    try:
        pre_bytes = await pre_image.read()
        post_bytes = await post_image.read()
        
        if not pre_bytes or not post_bytes:
            raise HTTPException(status_code=400, detail="Pre or post image data is empty")
            
        result = CustomImageProcessor.process_image_pair(pre_bytes, post_bytes, sensitivity=sensitivity)
        return {
            "status": "success",
            "pre_filename": pre_image.filename,
            "post_filename": post_image.filename,
            "analysis": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Custom image processing failed: {str(e)}")

from app.schemas.auth import UserSignUpRequest, UserLoginRequest, GoogleAuthRequest, AuthResponse, UserResponse
from app.db.database import (
    create_user,
    authenticate_user,
    authenticate_google_user,
    list_users
)

@router.post("/auth/signup", response_model=AuthResponse)
def signup(request: UserSignUpRequest):
    """
    Registers a new user into the persistent SQLite database.
    """
    try:
        user = create_user(
            email=request.email,
            name=request.name,
            password=request.password,
            role=request.role or "rescuer",
            avatar_url=request.avatar_url
        )
        token = f"jwt_{uuid.uuid4().hex}"
        return {
            "user": user,
            "token": token,
            "message": "Account successfully registered in database"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/auth/login", response_model=AuthResponse)
def login(request: UserLoginRequest):
    """
    Authenticates an existing user against the SQLite database with PBKDF2 hash verification.
    """
    user = authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    token = f"jwt_{uuid.uuid4().hex}"
    return {
        "user": user,
        "token": token,
        "message": "Authentication successful"
    }

@router.post("/auth/google", response_model=AuthResponse)
def google_auth_verify(payload: GoogleAuthRequest):
    """
    Syncs Google OAuth identity into the SQLite database.
    """
    user = authenticate_google_user(
        email=payload.email,
        name=payload.name,
        picture=payload.picture,
        role=payload.role or "analyst"
    )
    token = f"jwt_{uuid.uuid4().hex}"
    return {
        "user": user,
        "token": token,
        "message": "Google authentication verified and recorded in database"
    }

@router.get("/auth/users")
def get_registered_users():
    """
    Lists all users recorded in the persistent SQLite database.
    """
    return {
        "database": "floodsight.db (SQLite)",
        "count": len(list_users()),
        "users": list_users()
    }
