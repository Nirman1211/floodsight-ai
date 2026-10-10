import numpy as np
import cv2
from typing import Dict, Any, List
from shapely.geometry import Polygon, MultiPolygon, shape, mapping
from shapely.ops import unary_union
from app.services.sentinel_sar import SentinelSARProcessor
from app.services.dem_service import DEMService

class BaselineFloodDetector:
    """
    End-to-end baseline flood & debris change detection pipeline.
    Combines SAR backscatter ratio, slope gating, morphological filtering,
    and polygon vectorization.
    """
    
    @staticmethod
    def run_detection(
        pre_vv_db: np.ndarray,
        post_vv_db: np.ndarray,
        elevation: np.ndarray,
        bbox: List[float],
        water_thresh_db: float = -3.2,
        max_slope_deg: float = 15.0
    ) -> Dict[str, Any]:
        """
        Runs complete change detection on raster matrices and outputs GeoJSON.
        bbox is [min_lon, min_lat, max_lon, max_lat]
        """
        min_lon, min_lat, max_lon, max_lat = bbox
        height, width = pre_vv_db.shape
        
        # 1. Filter speckle
        filt_pre = SentinelSARProcessor.apply_lee_filter(pre_vv_db, size=5)
        filt_post = SentinelSARProcessor.apply_lee_filter(post_vv_db, size=5)
        
        # 2. Compute slope
        slope_deg = DEMService.compute_slope(elevation, cell_size_m=30.0)
        
        # 3. Detect change mask
        raw_mask = SentinelSARProcessor.detect_water_and_debris(
            filt_pre, filt_post, slope_deg,
            water_threshold_db=water_thresh_db,
            max_slope_water=max_slope_deg
        )
        
        # 4. Morphological noise cleanup (sieve filtering)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        clean_mask = cv2.morphologyEx(raw_mask, cv2.MORPH_OPEN, kernel)
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel)
        
        # 5. Calculate impacted area
        # 30m resolution per pixel -> 900 m2
        pixel_area_m2 = 30.0 * 30.0
        impacted_pixels = int(np.sum(clean_mask > 0))
        area_m2 = impacted_pixels * pixel_area_m2
        area_km2 = round(area_m2 / 1_000_000.0, 3)
        area_hectares = round(area_m2 / 10_000.0, 2)
        
        # 6. Vectorize to GeoJSON polygons
        contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        polygons = []
        
        lon_step = (max_lon - min_lon) / width
        lat_step = (max_lat - min_lat) / height
        
        for cnt in contours:
            # Filter negligible tiny noise (< 5 pixels)
            if cv2.contourArea(cnt) < 5:
                continue
            
            coords = []
            for pt in cnt:
                px, py = pt[0]
                # Invert y because raster rows go from top (max_lat) to bottom (min_lat)
                lon = min_lon + px * lon_step
                lat = max_lat - py * lat_step
                coords.append((round(lon, 6), round(lat, 6)))
                
            if len(coords) >= 3:
                coords.append(coords[0])  # Close ring
                try:
                    poly = Polygon(coords)
                    if poly.is_valid and poly.area > 0:
                        polygons.append(poly)
                except Exception:
                    continue
                    
        geojson_features = []
        if polygons:
            merged = unary_union(polygons)
            if merged.geom_type == "Polygon":
                geojson_features.append({
                    "type": "Feature",
                    "geometry": mapping(merged),
                    "properties": {
                        "class": "Inundation and Sediment Flow",
                        "area_km2": area_km2,
                        "sensor": "Sentinel-1 SAR C-band",
                        "confidence": "High"
                    }
                })
            elif merged.geom_type == "MultiPolygon":
                for p in merged.geoms:
                    geojson_features.append({
                        "type": "Feature",
                        "geometry": mapping(p),
                        "properties": {
                            "class": "Inundation and Sediment Flow",
                            "area_km2": round(p.area * 111 * 111, 4),
                            "sensor": "Sentinel-1 SAR C-band",
                            "confidence": "High"
                        }
                    })
                    
        geojson = {
            "type": "FeatureCollection",
            "features": geojson_features
        }
        
        return {
            "area_km2": area_km2,
            "area_hectares": area_hectares,
            "geojson": geojson,
            "mask_shape": clean_mask.shape
        }
