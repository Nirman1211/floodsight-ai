import numpy as np
from scipy.ndimage import uniform_filter

class SentinelSARProcessor:
    """
    Implements SAR calibration, speckle filtering, and change detection.
    """
    
    @staticmethod
    def apply_lee_filter(img: np.ndarray, size: int = 5) -> np.ndarray:
        """
        Applies a classic Lee speckle filter on SAR intensity imagery.
        Preserves edges while reducing multiplicative granular speckle noise.
        """
        img_mean = uniform_filter(img, (size, size))
        img_sqr_mean = uniform_filter(img**2, (size, size))
        img_variance = np.maximum(img_sqr_mean - img_mean**2, 1e-10)
        
        overall_variance = np.var(img)
        img_weights = img_variance / (img_variance + overall_variance + 1e-10)
        img_weights = np.clip(img_weights, 0.0, 1.0)
        
        filtered = img_mean + img_weights * (img - img_mean)
        return filtered

    @staticmethod
    def compute_backscatter_difference(pre_vv: np.ndarray, post_vv: np.ndarray) -> np.ndarray:
        """
        Computes logarithmic backscatter difference: Delta sigma0_VV = post - pre (in dB).
        Large negative values indicate specular attenuation (inundated water).
        """
        diff = post_vv - pre_vv
        return diff

    @staticmethod
    def detect_water_and_debris(
        pre_vv_db: np.ndarray,
        post_vv_db: np.ndarray,
        slope_deg: np.ndarray,
        water_threshold_db: float = -3.2,
        max_slope_water: float = 15.0
    ) -> np.ndarray:
        """
        Identifies floodwater and debris changes:
        1. Backscatter decrease beyond threshold (water specular reflection).
        2. Slope mask rejection (water cannot stand on mountain cliffs > 15 deg).
        """
        diff_vv = post_vv_db - pre_vv_db
        
        # Water: Significant backscatter drop + flat/valley slope
        water_mask = (diff_vv <= water_threshold_db) & (slope_deg <= max_slope_water)
        
        # Debris: Backscatter increase in river channels due to rough rocky deposits
        debris_mask = (diff_vv >= 2.8) & (slope_deg <= 20.0)
        
        # Combined flood inundation & sediment deposit mask
        combined_impact = water_mask | debris_mask
        return combined_impact.astype(np.uint8)
