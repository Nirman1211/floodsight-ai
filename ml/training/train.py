import os
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import torch
import torch.nn as nn
import torch.optim as optim
from ml.models.unet import SatelliteFloodUNet
from ml.datasets.kuro_siwo_loader import get_dataloaders

class DiceLoss(nn.Module):
    def __init__(self, smooth: float = 1e-6):
        super().__init__()
        self.smooth = smooth

    def forward(self, preds: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        preds = preds.contiguous().view(-1)
        targets = targets.contiguous().view(-1)
        intersection = (preds * targets).sum()
        dice = (2.0 * intersection + self.smooth) / (preds.sum() + targets.sum() + self.smooth)
        return 1.0 - dice

def compute_iou(preds: torch.Tensor, targets: torch.Tensor, thresh: float = 0.5) -> float:
    preds_bin = (preds > thresh).float()
    intersection = (preds_bin * targets).sum().item()
    union = (preds_bin + targets).clamp(0, 1).sum().item()
    if union == 0:
        return 1.0
    return intersection / union

def train_flood_model(epochs: int = 5, lr: float = 1e-3, save_dir: str = "ml/checkpoints"):
    os.makedirs(save_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    model = SatelliteFloodUNet(in_channels=4, out_channels=1, base_filters=16).to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    bce_loss_fn = nn.BCELoss()
    dice_loss_fn = DiceLoss()

    train_loader, val_loader = get_dataloaders(batch_size=8)
    best_val_iou = 0.0
    best_checkpoint_path = os.path.join(save_dir, "flood_unet_best.pt")

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            preds = model(x)
            loss = bce_loss_fn(preds, y) + dice_loss_fn(preds, y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_train_loss = total_loss / len(train_loader)

        # Validation phase
        model.eval()
        val_ious = []
        with torch.no_grad():
            for x_val, y_val in val_loader:
                x_val, y_val = x_val.to(device), y_val.to(device)
                val_preds = model(x_val)
                val_ious.append(compute_iou(val_preds, y_val))

        avg_val_iou = sum(val_ious) / len(val_ious)
        print(f"Epoch [{epoch}/{epochs}] - Train Loss: {avg_train_loss:.4f} - Val IoU: {avg_val_iou:.4f}")

        if avg_val_iou > best_val_iou:
            best_val_iou = avg_val_iou
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_iou": best_val_iou,
                "attribution": "Kuro Siwo dataset © Bountos et al., NeurIPS 2024"
            }, best_checkpoint_path)

    print(f"Training complete! Best Checkpoint saved to: {best_checkpoint_path} (Val IoU: {best_val_iou:.4f})")
    return best_checkpoint_path

if __name__ == "__main__":
    train_flood_model(epochs=3)
