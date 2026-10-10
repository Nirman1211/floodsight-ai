# Architecture Specification: FloodSight AI
**Project: FloodSight AI — Mapping Flood Damage from Space**  
**Hackathon: IIT Mandi Multimodal AI Hackathon 2026**

---

## 1. System Dataflow

```
User (Web UI / CLI)
        │
        ▼
[FastAPI REST API /api/v1]
        │
        ├─► /analyses (Job Submission & Background Runner)
        │       │
        │       ├─► 1. Data Discovery Service (Copernicus CDSE STAC / Mock OData)
        │       ├─► 2. Geospatial Preprocessing Engine (Radiometric calib + co-registration)
        │       ├─► 3. Change Detection & AI Segmentation (U-Net & Baseline Otsu + NDWI)
        │       ├─► 4. Vectorization & Polygon Cleaning (Raster to GeoJSON polygons)
        │       ├─► 5. Infrastructure Impact Overlay (Historical OSM via ohsome)
        │       ├─► 6. Road Graph Network Analysis (NetworkX reachability & isolation)
        │       ├─► 7. Downstream Hydrology Flow Path (D8 Flow on Copernicus DEM)
        │       └─► 8. Situation Report & Factual Copilot Generator (PDF + Grounded QA)
        │
        └─► /results /layers /report (Outputs & Provenance Delivery)
```

---

## 2. API Schema Contracts

### `POST /api/v1/analyses`
**Request Payload**:
```json
{
  "name": "Trishuli Valley August 2026",
  "bbox": [85.15, 27.90, 85.35, 28.15],
  "event_date": "2026-08-26",
  "pre_window_days": 15,
  "post_window_days": 15,
  "sensors": ["sentinel-1", "sentinel-2", "copernicus-dem"],
  "model_type": "hybrid_unet_baseline",
  "slope_threshold_deg": 15.0
}
```

**Response Payload**:
```json
{
  "job_id": "job_trishuli_20260826_01",
  "status": "queued",
  "created_at": "2026-10-11T00:56:00Z"
}
```

### `GET /api/v1/analyses/{job_id}/results`
Returns:
- Flood extent area in $km^2$ and hectares.
- Impacted road length (meters) and bridge count.
- Count of exposed building footprints.
- Cut-off settlements list (settlement name, baseline distance, post-event status).
- Hydrological flow path line coordinates.
- Mandatory attributions.
