# Scientific Research & Remote Sensing Foundations
**Project: FloodSight AI**  
**Track: IIT Mandi Multimodal AI Hackathon 2026 — Track B**

---

## 1. SAR Physics & Mountain Flood Mapping

Synthetic Aperture Radar (SAR) is an active microwave remote sensing system. Unlike optical sensors that rely on reflected solar illumination, SAR transmits its own coherent microwave electromagnetic pulses (C-band: ~5.405 GHz, $\lambda \approx 5.6\text{ cm}$) and measures the backscattered signal ($\sigma^0$).

### 1.1 Why Sentinel-1 SAR is Essential for Monsoon Floods
- **Cloud Penetration**: C-band radar wavelengths are orders of magnitude larger than atmospheric rain droplets and cloud water vapor aerosols ($\lambda \gg r$), resulting in negligible Rayleigh scattering. SAR penetrates dense Himalayan monsoon clouds, haze, and night conditions.
- **Specular Reflection vs Roughness**:
  - Smooth open water surfaces act as specular reflectors, scattering incoming microwave pulses away from the antenna $\to$ very low backscatter values (dark pixels, typically $-22\text{ dB}$ to $-16\text{ dB}$ in VV/VH).
  - Normal land, vegetation, and soil produce diffuse volume and surface backscatter (moderate return, $-14\text{ dB}$ to $-8\text{ dB}$).
  - Rough debris deposits, gravel bars, and boulders create high surface roughness and double-bounce reflections $\to$ elevated backscatter (bright pixels, $>-6\text{ dB}$).

### 1.2 The Critical 12-Day Same-Orbit Track Rule
Sentinel-1 follows an exact 12-day repeat orbit (or 6 days in two-satellite constellations).
- **Geometric Distortion**: In steep Himalayan valleys (Trishuli gorge), side-looking radar geometry produces severe **foreshortening**, **layover**, and **radar shadow** depending on the look angle and flight direction (Ascending vs Descending).
- **The Golden Rule**: Pre-event and post-event SAR scenes MUST share the identical relative orbit track and incidence angle. Subtracting an ascending pass from a descending pass introduces false terrain topography differences that destroy change detection accuracy.

---

## 2. Optical Remote Sensing (Sentinel-2 MSI)

When cloud gaps exist, Sentinel-2 MultiSpectral Instrument (MSI) provides 10m to 20m resolution across 13 spectral bands.

### 2.1 Normalized Difference Water Index (NDWI & MNDWI)
- **Classic McFeeters NDWI**:
  $$\text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}} = \frac{B03 - B08}{B03 + B08}$$
- **Modified Xu MNDWI (Superior for sediment/turbid water)**:
  $$\text{MNDWI} = \frac{\text{Green} - \text{SWIR1}}{\text{Green} + \text{SWIR1}} = \frac{B03 - B11}{B03 + B11}$$
  *Rationale*: Sediment-laden Himalayan glacial runoff has elevated reflectance in NIR; SWIR absorption suppresses false sediment signals while delineating turbulent slurry.

### 2.2 Cloud & Cloud-Shadow Masking
We employ Sentinel-2 Level-2A Scene Classification Layer (SCL) to mask out:
- SCL 8: Cloud medium probability
- SCL 9: Cloud high probability
- SCL 10: Thin cirrus
- SCL 3: Cloud shadows

---

## 3. Topographic Slope Correction using Copernicus DEM

In rugged terrain, dark radar shadows on mountain facets facing away from the radar line-of-sight mimic the low backscatter of water.
- Using Copernicus WorldDEM-30 (30m spatial resolution), we compute the local topographic slope ($\theta$):
  $$\theta = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right)$$
- **Hydrological Physical Constraint**: Water does not stand in pools on steep mountain valley walls. Any detected low-backscatter change pixel with slope $\theta > 15^\circ$ is masked as a false positive (radar shadow / terrain artifact).
