# Data Compliance and Licensing Policy
**Project: FloodSight AI**  
**Hackathon: IIT Mandi Multimodal AI Hackathon 2026 — Track B**

---

## 1. Core Data Rules & Regulatory Boundaries

In accordance with official Track B challenge guidelines, the system operates under strict data separation to prevent data leakage and guarantee independent evaluation.

### Permitted Analytical Inputs (Operational Pipeline)
These datasets are allowed to be fed into the data ingestion, change detection, and routing pipelines:
1. **Sentinel-1 SAR Radar**: Pre- and post-event Ground Range Detected (GRD) products obtained via Copernicus Data Space Ecosystem (`dataspace.copernicus.eu`).
2. **Sentinel-2 Optical (MSI)**: Pre- and post-event Level-2A surface reflectance products when cloud cover permits.
3. **Copernicus DEM**: 30-meter elevation model (WorldDEM-30 / GLO-30) for slope filtering and downstream flow routing.
4. **OpenStreetMap (OSM) Pre-Event Historical Snapshot**: Extracted strictly prior to 26 August 2026 (e.g., snapshot of 27 July 2026 or earlier via the `ohsome` API).
5. **Permitted AI Training Corpora**:
   - *Kuro Siwo* (Bountos et al., NeurIPS 2024, MIT License).
   - *Sen1Floods11* (Bonafilia et al., CVPRW 2020, CC BY 4.0).

### Strictly Restricted Reference Products (Checking & Validation ONLY)
The following sources **MUST NEVER** be used as training labels, input features, spatial priors, or calibration targets:
1. **Copernicus EMS EMSR927 activation maps** (Trishuli flood).
2. **UNOSAT satellite damage assessments**.
3. **Any published flood/debris extent maps**.
4. **Post-event OpenStreetMap edits**.

*Compliance Enforcement*: The analytical engine processes raw sensor data completely blind to EMSR927. The reference polygons are only loaded in a dedicated post-hoc evaluation module to report comparative metrics (IoU, precision, recall) after predictions are frozen.

---

## 2. Mandatory Attributions

Every generated map layer, GeoJSON export, dashboard visualization, and situation report PDF carries the following mandatory attribution strings:

> **"Contains modified Copernicus Sentinel data 2026."**

> **"Produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved."**

> **"© OpenStreetMap contributors."**

### Training Dataset Citations:
- **Kuro Siwo**: Bountos, N. I., et al. (2024). *Kuro Siwo: A Multimodal SAR and Optical Dataset for Global Wildfire and Flood Mapping*. NeurIPS 2024.
- **Sen1Floods11**: Bonafilia, D., et al. (2020). *Sen1Floods11: A Georeferenced Dataset to Train and Test Deep Learning Flood Algorithms for Sentinel-1*. CVPR Workshops 2020.
- **Copernicus Emergency Management Service**: European Union, Copernicus Emergency Management Service data (EMSR927).

---

## 3. License Matrix

| Component | Upstream Source | License | Usage in Project |
| :--- | :--- | :--- | :--- |
| Sentinel-1 SAR | ESA / Copernicus | Copernicus Open Access | Analytical input |
| Sentinel-2 Optical | ESA / Copernicus | Copernicus Open Access | Analytical input |
| WorldDEM-30 / GLO-30 | DLR / Airbus / ESA | Copernicus Open Access | Analytical input |
| OpenStreetMap Snapshot | OSM Foundation / ohsome | ODbL (Open Database License) | Pre-event infrastructure |
| Kuro Siwo Dataset | Orion-AI-Lab | MIT License | ML model training |
| EMSR927 Reference | Copernicus EMS | Free of charge (credit required) | Post-hoc validation only |
| FloodSight AI Codebase | IIT Mandi Hackathon Team | MIT License | Full application code |
