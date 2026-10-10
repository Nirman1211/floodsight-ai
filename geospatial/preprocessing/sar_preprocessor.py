import numpy as np
import rasterio
from rasterio.transform import from_bounds
from typing import List, Tuple

class SARPreprocessor:
    """
    Standardizes SAR intensity processing:
    - Orbit geometry verification
    - Radiometric calibration from raw DN to decibels (dB)
    - GeoTIFF raster exporter using Rasterio
    """
    
    @staticmethod
    def verify_orbit_compatibility(pre_orbit: int, post_orbit: int, pre_dir: str, post_dir: str) -> bool:
        """
        Ensures both scenes share the exact same relative orbit number and looking geometry.
        Cross-orbit comparison is physically invalid in mountainous terrain.
        """
        if pre_orbit != post_orbit:
            return False
        if pre_dir.upper() != post_dir.upper():
            return False
        return True

    @staticmethod
    def dn_to_sigma0_db(digital_numbers: np.ndarray, calibration_factor: float = 1.0) -> np.ndarray:
        """
        Converts raw SAR digital numbers to calibrated backscatter coefficient sigma0 (dB).
        sigma0_dB = 10 * log10(DN^2 / A^2)
        """
        intensity = np.maximum(digital_numbers.astype(np.float32)**2, 1e-10)
        sigma0_db = 10.0 * np.log10(intensity * calibration_factor)
        return sigma0_db

    @staticmethod
    def export_geotiff(
        data: np.ndarray,
        output_path: str,
        bbox: List[float],
        crs: str = "EPSG:4326"
    ) -> str:
        """
        Exports a 2D numpy array as a georeferenced GeoTIFF using Rasterio.
        bbox is [min_lon, min_lat, max_lon, max_lat]
        """
        height, width = data.shape
        min_lon, min_lat, max_lon, max_lat = bbox
        
        transform = from_bounds(min_lon, min_lat, max_lon, max_lat, width, height)
        
        with rasterio.open(
            output_path,
            "w",
            driver="GTiff",
            height=height,
            width=width,
            count=1,
            dtype=data.dtype,
            crs=crs,
            transform=transform,
        ) as dst:
            dst.write(data, 1)
            
        return output_path
