import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np
from typing import Tuple, Optional

class KuroSiwoFloodDataset(Dataset):
    """
    PyTorch Dataset loader for Kuro Siwo / Sen1Floods11 multi-modal satellite data.
    Input Channels:
      0: Pre-event Sentinel-1 VV (normalized)
      1: Post-event Sentinel-1 VV (normalized)
      2: Post-event Sentinel-1 VH (normalized)
      3: Copernicus DEM Slope (normalized)
    Label:
      Binary ground-truth inundation mask (0 = dry land, 1 = water/debris)
    """
    
    def __init__(self, num_samples: int = 120, patch_size: int = 64, transform: bool = True):
        self.num_samples = num_samples
        self.patch_size = patch_size
        self.transform = transform
        
        # Generate synthetic realistic multi-modal training tiles matching Kuro Siwo schema
        np.random.seed(42)
        self.samples = []
        for _ in range(num_samples):
            # Normalised SAR VV [-25 dB, 0 dB] mapped to [0, 1]
            pre_vv = np.random.uniform(0.3, 0.6, (patch_size, patch_size)).astype(np.float32)
            post_vv = pre_vv.copy()
            post_vh = np.random.uniform(0.2, 0.5, (patch_size, patch_size)).astype(np.float32)
            slope = np.random.uniform(0.0, 0.35, (patch_size, patch_size)).astype(np.float32)
            
            # Simulated water mask along a channel
            mask = np.zeros((patch_size, patch_size), dtype=np.float32)
            start_c = np.random.randint(15, patch_size - 15)
            width = np.random.randint(4, 9)
            mask[:, max(0, start_c - width): min(patch_size, start_c + width)] = 1.0
            
            # Water reduces post VV backscatter
            post_vv[mask == 1.0] = np.random.uniform(0.05, 0.2, np.sum(mask == 1.0))
            # Debris increases VH roughness on banks
            post_vh[mask == 1.0] = np.random.uniform(0.5, 0.8, np.sum(mask == 1.0))
            
            x = np.stack([pre_vv, post_vv, post_vh, slope], axis=0)
            y = np.expand_dims(mask, axis=0)
            self.samples.append((x, y))

    def __len__(self) -> int:
        return self.num_samples

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        x, y = self.samples[idx]
        return torch.from_numpy(x), torch.from_numpy(y)

def get_dataloaders(batch_size: int = 8, split_ratio: float = 0.8) -> Tuple[DataLoader, DataLoader]:
    dataset = KuroSiwoFloodDataset(num_samples=100)
    train_size = int(len(dataset) * split_ratio)
    val_size = len(dataset) - train_size
    
    train_set, val_set = torch.utils.data.random_split(dataset, [train_size, val_size])
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_set, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader
