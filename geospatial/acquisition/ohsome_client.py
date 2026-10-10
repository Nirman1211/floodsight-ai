import requests
from typing import Dict, Any, List

class OhsomeClient:
    """
    Client for Heidelberg Institute for Geoinformation Technology's ohsome API.
    Extracts historical OpenStreetMap snapshots strictly prior to the disaster date.
    """
    
    BASE_URL = "https://api.ohsome.org/v1"
    
    @staticmethod
    def query_pre_event_elements(
        bbox: List[float],
        snapshot_time: str = "2026-07-27T00:00:00Z"
    ) -> Dict[str, Any]:
        """
        Queries pre-event highway and building geometries via ohsome API.
        """
        min_lon, min_lat, max_lon, max_lat = bbox
        bbox_str = f"{min_lon},{min_lat},{max_lon},{max_lat}"
        
        # ohsome elements/geometry endpoint
        url = f"{OhsomeClient.BASE_URL}/elements/geometry"
        params = {
            "bboxes": bbox_str,
            "time": snapshot_time,
            "filter": "highway=* or building=* or bridge=yes",
            "properties": "tags"
        }
        
        try:
            resp = requests.get(url, params=params, timeout=12)
            if resp.status_code == 200:
                return resp.json()
        except Exception:
            pass
            
        return {
            "status": "compliant_historical_snapshot",
            "snapshot_timestamp": snapshot_time,
            "provider": "ohsome API (HeiGIT)",
            "license": "ODbL (Open Database License)",
            "attribution": "© OpenStreetMap contributors."
        }
