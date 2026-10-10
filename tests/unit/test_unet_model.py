import torch
import pytest
from ml.models.unet import SatelliteFloodUNet

def test_satellite_unet_forward_pass():
    # 4 channels: [Pre-VV, Post-VV, Post-VH, Slope]
    model = SatelliteFloodUNet(in_channels=4, out_channels=1, base_filters=16)
    model.eval()
    
    # Batch size 2, 4 channels, 64x64 spatial resolution
    dummy_input = torch.randn(2, 4, 64, 64)
    
    with torch.no_grad():
        output = model(dummy_input)
        
    # Output should have exact shape [2, 1, 64, 64] and values in [0, 1] (sigmoid)
    assert output.shape == (2, 1, 64, 64)
    assert output.min().item() >= 0.0
    assert output.max().item() <= 1.0
