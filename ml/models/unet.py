import torch
import torch.nn as nn

class DoubleConv(nn.Module):
    """(convolution => [BN] => ReLU) * 2"""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.double_conv(x)

class SatelliteFloodUNet(nn.Module):
    """
    Lightweight, high-accuracy U-Net for satellite SAR & Topographic flood segmentation.
    Input: [B, in_channels, H, W]
    Output: [B, 1, H, W] (Logits or Probabilities)
    """
    def __init__(self, in_channels: int = 4, out_channels: int = 1, base_filters: int = 32):
        super().__init__()
        self.inc = DoubleConv(in_channels, base_filters)
        self.down1 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(base_filters, base_filters * 2))
        self.down2 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(base_filters * 2, base_filters * 4))
        self.down3 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(base_filters * 4, base_filters * 8))
        
        self.up1 = nn.ConvTranspose2d(base_filters * 8, base_filters * 4, kernel_size=2, stride=2)
        self.conv_up1 = DoubleConv(base_filters * 8, base_filters * 4)
        
        self.up2 = nn.ConvTranspose2d(base_filters * 4, base_filters * 2, kernel_size=2, stride=2)
        self.conv_up2 = DoubleConv(base_filters * 4, base_filters * 2)
        
        self.up3 = nn.ConvTranspose2d(base_filters * 2, base_filters, kernel_size=2, stride=2)
        self.conv_up3 = DoubleConv(base_filters * 2, base_filters)
        
        self.outc = nn.Conv2d(base_filters, out_channels, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        
        d1 = self.up1(x4)
        d1 = torch.cat([d1, x3], dim=1)
        d1 = self.conv_up1(d1)
        
        d2 = self.up2(d1)
        d2 = torch.cat([d2, x2], dim=1)
        d2 = self.conv_up2(d2)
        
        d3 = self.up3(d2)
        d3 = torch.cat([d3, x1], dim=1)
        d3 = self.conv_up3(d3)
        
        logits = self.outc(d3)
        return torch.sigmoid(logits)

def create_model(in_channels: int = 4) -> SatelliteFloodUNet:
    return SatelliteFloodUNet(in_channels=in_channels)
