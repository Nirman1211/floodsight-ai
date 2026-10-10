# Model Card: FloodSight AI U-Net
**Model Architecture**: Multi-Modal U-Net with Residual Connections  
**Target Domain**: Satellite-Based Flood & Sediment Inundation Segmentation  

---

## 1. Model Summary
- **Input Channels**: 4 Channels:
  - Channel 0: Pre-event Sentinel-1 SAR VV backscatter amplitude (normalized $\text{dB}$)
  - Channel 1: Post-event Sentinel-1 SAR VV backscatter amplitude (normalized $\text{dB}$)
  - Channel 2: Post-event Sentinel-1 SAR VH backscatter amplitude (normalized $\text{dB}$)
  - Channel 3: Copernicus DEM Topographic Slope ($\text{degrees} / 90.0$)
- **Output**: Binary Inundation / Surface Change Probability Map ($H \times W \times 1$).
- **Loss Function**: Combined Binary Cross Entropy + Soft Dice Loss:
  $$\mathcal{L} = \mathcal{L}_{\text{BCE}} + (1 - \text{Dice})$$

---

## 2. Training Data & Compliance
- **Permitted Corpora**: Kuro Siwo (NeurIPS 2024, MIT License) & Sen1Floods11 (CVPRW 2020, CC BY 4.0).
- **Leakage Prevention**: Zero geographic overlap between training tiles and Himalayan evaluation scenes.
- **Reference Independence**: Copernicus EMSR927 maps were strictly excluded from model weights, gradients, and loss computations.
