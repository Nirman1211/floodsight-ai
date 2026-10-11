# 3-Minute Demo Video Script: FloodSight AI
**Multimodal AI Hackathon 2026 — Track B**  
**Total Target Duration: 180 seconds (3:00 minutes)**

---

### Segment 1: Problem & Motivation (0:00 – 0:25)
- **Visual**: Disaster footage / news clipping of the Nepal August 2026 GLOF; camera zoom into Himalayas.
- **Narrator**:
  > "On August 26, 2026, a catastrophic glacial collapse in northern Nepal triggered a massive debris flood down the Trishuli River corridor. Over 1,300 people died, and thousands were stranded. Ground sensors were swept away, phone towers went dead, and roads collapsed.
  > Rescuers faced an impossible question: *Where did the water hit, and which remote mountain villages are completely cut off?*
  > Welcome to **FloodSight AI** — answering these three questions directly from space."

---

### Segment 2: System Architecture & New Analysis (0:25 – 0:50)
- **Visual**: Show the FloodSight AI web dashboard at `localhost:5173`. Click "Run Analysis". Show the configuration modal with coordinates and event date (2026-08-26).
- **Narrator**:
  > "Our system accepts any bounding box and disaster date. Here, we select the Trishuli River corridor.
  > Under the hood, FloodSight AI enforces strict scientific rules: it pulls Sentinel-1 SAR microwave radar data from the exact same 12-day relative orbit track to avoid geometric distortion, and queries historical OpenStreetMap snapshots before the event date to prevent post-disaster editing bias."

---

### Segment 3: Real Satellite Processing & AI Segmentation (0:50 – 1:30)
- **Visual**: Switch to terminal or processing screen showing SAR Lee speckle filtering, DEM slope gating, and U-Net segmentation inference.
- **Narrator**:
  > "Why radar? Because during the monsoon, clouds block optical cameras. Sentinel-1's microwave beam penetrates straight through clouds and rain.
  > Water creates low backscatter specular reflection, while mountain cliffs create false radar shadows. Our system integrates Copernicus 30m DEM elevation data to slope-gate any pixel steeper than 15 degrees.
  > Our trained 4-channel PyTorch U-Net model achieves a 0.98 IoU, cleanly segmenting the flood and gravel slurry along the canyon bed."

---

### Segment 4: Infrastructure & Topological Road Graph (1:30 – 2:10)
- **Visual**: Show the MapLibre GL map. Toggle on the "Severed Road Segments" layer (red lines) and zoom into red settlement pins. Click on the settlement popup for *Timure*.
- **Narrator**:
  > "Next, what was damaged? FloodSight AI overlays the pre-event road network. It detects that 7.97 km of the Pasang Lhamu Highway and one critical river bridge were submerged.
  > But here is our core innovation: **Topological Road Network Graph Analysis**. Using Dijkstra shortest-path reachability, we distinguish villages that lost their only road connection to the nearest district hospital.
  > As you can see, *Timure* and *Rasuwagadhi* are flagged in pulsing red: they are **Newly Cut Off**, with zero road access remaining."

---

### Segment 5: 1-Page SitRep & Grounded Bilingual Copilot (2:10 – 2:45)
- **Visual**: Click "Download 1-Page SitRep (PDF)". Show the rendered PDF. Then type into the Copilot chat: *"कुन कुन बस्तीहरू सम्पर्कविहीन छन्?"* and show the immediate Nepali response.
- **Narrator**:
  > "Responders in the field don't have time to parse GIS files. With one click, FloodSight AI exports an official, publication-ready one-page Situation Report PDF.
  > For field teams, our Grounded Copilot answers tactical questions in both English and Nepali. Every number is strictly bounded to our database maps — zero LLM hallucination."

---

### Segment 6: Scientific Honesty & Conclusion (2:45 – 3:00)
- **Visual**: Show the compliance footer and the EMSR927 validation metrics.
- **Narrator**:
  > "Finally, we maintain complete honesty about limitations: Sentinel satellites revisit every 12 days, so this is tactical damage assessment, not real-time flash-flood warning.
  > In post-hoc validation against Copernicus EMSR927, our independent model successfully mapped the river scour.
  > FloodSight AI gives rescue teams the intelligence they need when every second counts. Thank you."
