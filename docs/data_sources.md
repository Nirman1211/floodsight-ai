# Data Sources & Acquisition Registry
**Project: FloodSight AI**  
**Hackathon: Multimodal AI Hackathon 2026 — Track B**

---

## 1. Primary Sensor & Platform Sources

### 1.1 Sentinel-1 Synthetic Aperture Radar (SAR)
- **Provider**: European Space Agency (ESA) / Copernicus Data Space Ecosystem (CDSE).
- **Endpoint**: `https://dataspace.copernicus.eu/odata/v1/Products` & `https://catalogue.dataspace.copernicus.eu/stac`
- **Product Type**: Ground Range Detected (GRD), Interferometric Wide Swath (IW), High Resolution (HR).
- **Polarizations**: Dual-polarization VV + VH.
- **Repeat Cycle**: 12 days for single satellite; exact same relative orbit track (e.g., Track 019 for Trishuli corridor).
- **License**: Copernicus Open Access Policy (Free, full, and open).
- **Usage**: Analytical input for all-weather flood and debris detection.

### 1.2 Sentinel-2 MultiSpectral Instrument (MSI)
- **Provider**: ESA / Copernicus Data Space Ecosystem.
- **Product Type**: Level-2A (Bottom-of-Atmosphere surface reflectance with Scene Classification Layer SCL).
- **Bands**: Band 3 (Green, 10m), Band 8 (NIR, 10m), Band 11 (SWIR1, 20m).
- **License**: Copernicus Open Access Policy.
- **Usage**: Analytical input for clear-sky water color indices (MNDWI) and sediment delineation.

### 1.3 Copernicus DEM (WorldDEM-30 / GLO-30)
- **Provider**: Copernicus / DLR / Airbus Defence and Space.
- **Resolution**: 30m spatial resolution, global coverage.
- **Vertical Datum**: EGM2008 geoid.
- **Usage**: Slope calculation ($\theta \le 15^\circ$ slope gating to remove radar shadows) and downstream D8 hydrological flow path tracing.

### 1.4 OpenStreetMap (Pre-Event Historical Snapshot)
- **Provider**: OpenStreetMap contributors via the `ohsome` API (Heidelberg Institute for Geoinformation Technology).
- **Endpoint**: `https://api.ohsome.org/v1/`
- **Historical Filter**: Filtered strictly prior to 26 August 2026 (e.g., snapshot `2026-07-27T00:00:00Z`).
- **Features Extracted**: Highway networks (`highway=*`), bridges (`bridge=yes`), building footprints (`building=*`), settlements (`place=village|hamlet|town`), and healthcare facilities (`amenity=hospital|clinic`).
- **License**: Open Database License (ODbL).

---

## 2. Permitted AI Training Datasets

### 2.1 Kuro Siwo (Recommended)
- **Citation**: Bountos, N. I., et al. (2024). *Kuro Siwo: A Multimodal SAR and Optical Dataset for Global Wildfire and Flood Mapping*. NeurIPS 2024.
- **Repository**: `https://github.com/Orion-AI-Lab/KuroSiwo`
- **License**: MIT License / CC BY.
- **Contents**: Multi-temporal paired Sentinel-1 and Sentinel-2 tiles with expert inundation and sediment labels.

### 2.2 Sen1Floods11 (Optional Benchmark)
- **Citation**: Bonafilia, D., et al. (2020). *Sen1Floods11: A Georeferenced Dataset to Train and Test Deep Learning Flood Algorithms for Sentinel-1*. CVPR Workshops 2020.
- **Repository**: `https://github.com/cloudtostreet/Sen1Floods11`
- **License**: CC BY 4.0.

---

## 3. Restricted Checking Reference (Post-Hoc Validation ONLY)

### 3.1 Copernicus EMS Rapid Mapping Activation EMSR927
- **Event**: Glacial lake collapse and debris flood along the Bhote Koshi / Trishuli River corridor, Nepal.
- **Activation Portal**: `https://mapping.emergency.copernicus.eu/activations/EMSR927`
- **Role in Project**: **STRICTLY CHECKING-ONLY**. The polygon is loaded strictly in `geospatial/validation/emsr927_comparator.py` after predictions are frozen to report independent IoU and recall metrics.
