# SolTracker — Advanced Features Plan

**Version:** 0.2.0-draft
**Date:** 2026-03-19
**Status:** Proposed (post-v1 features)
**Depends on:** ai-dev/spec.md (v1 core features F1–F6)

---

## Feature Tiers

Features are organized into three tiers based on data availability, technical feasibility, and "wow factor." Each tier assumes the previous tier is complete.

---

## Tier 1: High-Impact, Data-Verified (v1.1)

### F7: Cinematic Fly-Through Mode
- Sample waypoints along traverse at regular intervals
- Animate view.goTo() with smooth easing, tilted camera (60° tilt)
- Calculate heading from consecutive waypoint bearings
- Speed controls: slow, medium, fast
- User can exit to free camera at any time

### F8: Sample Collection Map (Perseverance)
- Display all 33 sample tube locations
- Data: MMGIS sample layers or manually digitized depot locations
- Color-coded by type (rock core, regolith, atmosphere, witness)
- Three Forks depot highlighted at high zoom

### F9: Mars Dual Clock & Sol Calculator
- Mars Coordinated Time (MTC) and Local Mean Solar Time (LMST)
- Real-time counter for active rovers
- Mars season from solar longitude Ls

### F10: Drive Efficiency Analytics
- Distance per sol histogram, idle time analysis
- Longest single drive, cumulative distance chart (all rovers overlaid)
- "Distance race" normalized timeline mode

### F11: Deep Space Network Live Status
- DSN XML feed: https://eyes.nasa.gov/dsn/data/dsn.xml
- Show active antenna-to-rover communication links
- Signal round-trip light time display
- Graceful degradation when feed unavailable

### F12: URL Deep-Linking & Shareability
- Hash-based routing for GitHub Pages
- Serialize: rover, sol, camera position, basemap, visible layers, active panel
- "Share" button copies URL to clipboard

---

## Tier 2: Ambitious, Verified Feasible (v1.2)

### F13: 3D Rover Model Placement
- glTF models from nasa3d.arc.nasa.gov
- ObjectSymbol3DLayer, oriented by yaw from waypoint data
- LOD: 2D icon at low zoom, 3D model at high zoom

### F14: Geological Map Overlay
- USGS Global Geological Map (shapefiles → GeoJSON)
- CRISM mineral maps via Mars Trek WMTS
- Toggle overlay, opacity slider, click for unit info

### F15: Ingenuity Helicopter Tracking
- MMGIS data: m20_heli_waypoints.json, m20_heli_flight_path.json
- 3D arcs above terrain for flight paths
- 72 flights, color #9B59B6 (purple)

### F16: "This Sol in History" Cross-Mission Timeline
- Compare all rovers at the same sol number
- Milestone sols curated in src/data/milestones.json

### F17: Earth Scale Comparison
- Project Earth region boundaries onto Mars surface
- ArcGIS projection engine handles cross-CRS transforms

---

## Tier 3: Aspirational / Experimental (v2.0)

### F18: AI-Powered Science Narrator (BYOK Claude API)
### F19: Slope & Terrain Difficulty Analysis
### F20: Raw Image Feed
### F21: Mars Panorama Viewer
### F22: Offline PWA Mode

---

## Recommended Build Order

**v1.1:** F12 → F9 → F8 → F7 → F10 → F11
**v1.2:** F15 → F13 → F17 → F16 → F14
**v2.0:** F18 → F20 → F19 → F21 → F22
