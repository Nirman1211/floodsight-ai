from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    name: str = Field(default="Trishuli River GLOF Assessment", description="Name of the analysis job")
    bbox: List[float] = Field(default=[85.15, 27.90, 85.35, 28.18], description="[min_lon, min_lat, max_lon, max_lat]")
    event_date: str = Field(default="2026-08-26", description="YYYY-MM-DD date of the flood event")
    pre_window_days: int = Field(default=15, description="Days before event for baseline imagery")
    post_window_days: int = Field(default=15, description="Days after event for post-disaster imagery")
    slope_threshold_deg: float = Field(default=15.0, description="Max mountain slope angle for water classification")
    upstream_breach_point: Optional[List[float]] = Field(default=[85.28, 28.16], description="[lon, lat] of upstream glacier rupture for flood path trace")

class AnalysisStatus(BaseModel):
    job_id: str
    status: str  # queued, discovering_data, preprocessing, running_inference, analysing_infrastructure, analysing_connectivity, generating_report, completed, failed
    progress: int  # 0 to 100
    message: str
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None

class SettlementImpact(BaseModel):
    id: str
    name: str
    coordinates: List[float]
    population_est: int
    baseline_nearest_facility: str
    baseline_distance_km: float
    post_event_accessible: bool
    status: str  # newly_cut_off, intact_access, baseline_isolated
    alternative_route_available: bool

class InfrastructureSummary(BaseModel):
    total_roads_analyzed_km: float
    exposed_road_length_km: float
    percentage_road_disrupted: float
    total_bridges: int
    exposed_bridges_count: int
    total_buildings: int
    exposed_buildings_count: int

class AnalysisResult(BaseModel):
    job_id: str
    name: str
    event_date: str
    bbox: List[float]
    total_flood_area_km2: float
    total_flood_area_hectares: float
    infrastructure: InfrastructureSummary
    settlements: List[SettlementImpact]
    cut_off_settlements_count: int
    flood_geojson: Dict[str, Any]
    exposed_roads_geojson: Dict[str, Any]
    exposed_buildings_geojson: Dict[str, Any]
    flood_flow_path_geojson: Optional[Dict[str, Any]] = None
    attributions: List[str]
    created_at: str

class CopilotQuery(BaseModel):
    question: str
    language: str = Field(default="en", description="'en' or 'ne' (Nepali)")

class CopilotResponse(BaseModel):
    answer: str
    grounded_metrics: Dict[str, Any]
    observation_dates: Dict[str, str]
    confidence_statement: str
