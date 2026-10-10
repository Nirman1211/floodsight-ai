import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FloodSight AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    PROCESSED_DIR: Path = DATA_DIR / "processed"
    REPORTS_DIR: Path = DATA_DIR / "reports"
    
    # Default Trishuli River Valley Bounding Box (Nepal GLOF Event, Aug 2026)
    DEFAULT_BBOX: list[float] = [85.15, 27.90, 85.35, 28.18]
    DEFAULT_EVENT_DATE: str = "2026-08-26"
    
    MANDATORY_ATTRIBUTIONS: list[str] = [
        "Contains modified Copernicus Sentinel data 2026.",
        "Produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.",
        "© OpenStreetMap contributors."
    ]

settings = Settings()

# Ensure directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
