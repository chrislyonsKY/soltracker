# Changelog

All notable changes to SolTracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-03-19

### Added

- **Mars 3D Globe (F1):** SceneView with WKID 104971, Viking MDIM imagery, MDEM elevation, fly-to-Jezero on load
- **Rover Traverse Display (F2):** Live MMGIS waypoints for Perseverance (98 pts) and Curiosity (343 pts), color-coded layers, waypoint popups
- **Sol Animation Engine (F3):** Play/pause, step forward/back, speed control (1-50x), camera follow, keyboard shortcuts (Space, Arrow keys), progressive path reveal
- **Mission Dashboard (F4):** Stats panel with rover name, sol, Earth date, distance, status; REMS weather widget with 1-hour cache
- **Photo Gallery (F5):** NASA Mars Photos API integration, camera filter dropdown, lightbox dialog, debounced sol-change fetch, BYOK API key dialog
- **Elevation Profile (F6):** SVG chart from waypoint Z-coordinates, min/max/ascent/descent terrain stats, sol position marker
- **Cinematic Fly-Through (F7):** Drone-style camera animation along traverse path with heading calculation, three speed presets
- **Sample Collection Map (F8):** Perseverance sample tube locations with Three Forks depot fallback data
- **Mars Dual Clock (F9):** Real-time MTC and LMST calculation, per-rover local time, current sol counter
- **Drive Efficiency Analytics (F10):** Driving/idle sols, longest drive, average distance, cumulative distance SVG chart
- **DSN Live Status (F11):** XML feed parser for Mars spacecraft signals, 30-second refresh, pulsing indicator
- **URL Deep-Linking (F12):** Hash-based state serialization (rover, sol, camera), share button
- **3D Rover Models (F13):** Official NASA GLB models (~12MB each) for all four rovers via PointSymbol3D + ObjectSymbol3DLayer
- **Geological Overlays (F14):** Mars Trek WMTS tile layers (thermal inertia, MOLA hillshade, THEMIS IR day) with toggle controls
- **Ingenuity Helicopter (F15):** Flight paths and waypoints from MMGIS, purple dashed lines, toggle from action bar
- **This Sol in History (F16):** Cross-rover milestone comparison with curated events database
- **Earth Scale Comparison (F17):** Place Kentucky, Texas, France, or Japan on Mars surface at rover locations
- **Terrain Difficulty (F19):** Per-segment slope analysis and classification (easy/moderate/difficult/hazardous)
- **Raw Image Feed (F20):** Latest unprocessed downlink images from Perseverance, auto-refresh every 5 minutes
- **Panorama Viewer (F21):** Curated notable panoramas from all four rovers with lightbox display
