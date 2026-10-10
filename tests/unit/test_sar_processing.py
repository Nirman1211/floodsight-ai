import numpy as np
import pytest
from app.services.sentinel_sar import SentinelSARProcessor
from app.services.dem_service import DEMService

def test_lee_filter_noise_reduction():
    # Synthetic noisy image
    np.random.seed(123)
    clean_signal = np.full((50, 50), -12.0)
    speckle_noise = np.random.normal(0, 3.0, (50, 50))
    noisy_img = clean_signal + speckle_noise
    
    filtered_img = SentinelSARProcessor.apply_lee_filter(noisy_img, size=5)
    
    # Variance of filtered image must be significantly lower than noisy image
    assert np.var(filtered_img) < np.var(noisy_img)

def test_slope_computation():
    # 45-degree flat incline: z changes by 30 meters over 30 meters grid spacing
    elevation = np.zeros((20, 20))
    for r in range(20):
        elevation[r, :] = r * 30.0  # 1 meter rise per 1 meter run
        
    slope = DEMService.compute_slope(elevation, cell_size_m=30.0)
    # Average slope should be approximately 45 degrees
    assert np.isclose(np.mean(slope[1:-1, 1:-1]), 45.0, atol=2.0)

def test_steep_slope_rejection_for_water():
    # Synthetic water detection pixel (-5 dB change), but on a 35-degree cliff
    pre_vv = np.array([[-10.0]])
    post_vv = np.array([[-16.0]]) # -6 dB change
    steep_slope = np.array([[35.0]]) # 35 deg mountain cliff
    
    mask = SentinelSARProcessor.detect_water_and_debris(
        pre_vv, post_vv, steep_slope,
        water_threshold_db=-3.2,
        max_slope_water=15.0
    )
    
    # Must be rejected because water cannot pool on a 35 degree mountain cliff!
    assert mask[0, 0] == 0
