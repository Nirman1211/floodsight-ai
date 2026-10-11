# Operational Limitations & Scientific Honesty
**Project: FloodSight AI**  
**Multimodal AI Hackathon 2026 — Track B**

---

## 1. Physical & Satellite Revisit Limitations

### 1.1 Temporal Revisit Lag vs Flash Flood Dynamics
- **Limitation**: Sentinel-1 SAR has a 12-day orbital repeat cycle (or 6 days in a dual-satellite constellation). A glacial outburst flood (GLOF) or flash flood reaches peak discharge and causes devastation within **30 minutes to 3 hours**.
- **Implication**: Spaceborne radar cannot provide real-time early warning minutes ahead of an avalanche or dam breach. It serves as a post-disaster tactical damage assessment tool (hours to days post-event).

### 1.2 Steep Mountain Radar Topography (Shadow & Layover)
- **Limitation**: In deep Himalayan gorges (such as the upper Bhote Koshi canyon), side-looking radar beams cannot illuminate valley walls facing away from the antenna (radar shadow). Radar shadow produces pitch-black pixels that mathematically resemble calm water backscatter.
- **Mitigation & Uncertainty**: FloodSight AI integrates Copernicus DEM slope gating ($\theta > 15^\circ$ rejection). However, true water under deep shadow remains unobservable until an opposing orbit (Descending vs Ascending) is available.

---

## 2. Infrastructure & Routing Limitations

### 2.1 Optical Geometric Intersection vs Structural Collapse
- **Limitation**: An intersection between a satellite-derived flood polygon and an OSM road line indicates **potential inundation/exposure**, NOT guaranteed physical destruction. A bridge might remain standing above floodwaters, or a road may be submerged under shallow water without asphalt erosion.
- **Communication**: The system explicitly labels results as "Potentially Exposed" rather than "Confirmed Destroyed".

### 2.2 Historical OSM Completeness
- In remote alpine villages of northern Nepal, informal trails and newly carved dirt tracks may not be mapped in pre-event OpenStreetMap data. Settlements marked as "disconnected" might have pedestrian walking paths that satellites cannot resolve.
