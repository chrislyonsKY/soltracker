# SolTracker — Product Specification

**Version:** 0.1.0-draft
**Author:** Chris Lyons
**Date:** 2026-03-19
**Status:** Draft

---

## 1. Vision

SolTracker is a 3D interactive Mars exploration dashboard that tracks the position of all four NASA Mars rovers — Perseverance, Curiosity, Opportunity, and Spirit — on a photorealistic Mars globe. Users scrub through mission history sol-by-sol, watching traverse paths animate across the Martian surface while synced dashboard panels display mission stats, rover photos, and terrain profiles.

The application runs entirely client-side as a static site on GitHub Pages, consuming public NASA and Esri data services with no backend required.

---

## 2. Target Users

- Space enthusiasts and citizen scientists exploring Mars mission data
- GIS developers learning ArcGIS JS SDK planetary capabilities
- Educators demonstrating Mars exploration in classroom settings

---

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript (strict) | 5.5+ |
| Build | Vite | 6.x |
| Map SDK | ArcGIS Maps SDK for JavaScript | 5.0 |
| UI Framework | Calcite Design System | 3.x |
| Spatial Reference | Mars_2000_Sphere (WKID 104971) | — |
| Deployment | GitHub Pages (static) | — |
| Testing | Vitest | 3.x |
| Linting | ESLint + typescript-eslint | — |

---

## 4. Feature Specifications

### F1: Mars 3D Globe (Priority: P0 — Foundation)

The core map canvas. All other features depend on this.

**Requirements:**
- R1.1: Render a 3D Mars globe using `<arcgis-scene>` with WKID 104971
- R1.2: Load Mars DEM elevation from `astro.arcgis.com/…/MDEM200M/ImageServer` as ground layer
- R1.3: Load Viking MDIM 2.1 color imagery as default basemap
- R1.4: Provide basemap toggle between Viking imagery and HRSC/MOLA shaded relief
- R1.5: Enable mouse/touch navigation (pan, zoom, rotate, tilt)
- R1.6: Display Mars nomenclature labels at appropriate zoom levels (optional enhancement)
- R1.7: Set initial camera to show full Mars globe, then fly to Jezero Crater on load
- R1.8: Dark theme via Calcite `calcite-mode-dark`

**Acceptance Criteria:**
- [ ] Mars globe renders with visible terrain relief within 5 seconds on broadband
- [ ] Basemap toggle switches between Viking and shaded relief without reload
- [ ] Camera smoothly animates to Jezero Crater after initial load
- [ ] Touch gestures work on tablet (pinch-zoom, two-finger rotate)

---

### F2: Rover Traverse Display (Priority: P0 — Core)

Load and display all four rover traverse paths on the globe.

**Requirements:**
- R2.1: Fetch Perseverance waypoints from `mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json`
- R2.2: Fetch Perseverance traverse line from `mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json`
- R2.3: Fetch Curiosity waypoints/traverse from equivalent MMGIS MSL endpoints
- R2.4: Load Spirit traverse from static GeoJSON in `src/data/spirit-traverse.geojson`
- R2.5: Load Opportunity traverse from static GeoJSON in `src/data/opportunity-traverse.geojson`
- R2.6: Convert Spirit/Opportunity PDS CSV data to GeoJSON (one-time ETL, pre-committed)
- R2.7: Style each rover's traverse path with its mission branding color (see DL-006)
- R2.8: Render waypoint markers at each sol stop, with sol number on hover/click
- R2.9: Show rover selection toggle to show/hide individual rover layers
- R2.10: Current rover position marker (distinct icon/symbol) at latest sol

**Data Transformation — MER Rovers:**
- Spirit CSV → GeoJSON: apply planar offset from lander at (-14.5692°, 175.4729°E)
- Opportunity CSV → GeoJSON: apply planar offset from lander at (-1.9462°, 354.4734°E → -5.5266°)
- Formula: `Δlat = Y_m / 59274.5`, `Δlon = X_m / (59274.5 × cos(lander_lat))`
- Include sol, site, drive, cumulative distance in GeoJSON properties

**Acceptance Criteria:**
- [ ] All four rover paths render on the globe with correct positioning
- [ ] Perseverance path matches NASA's interactive map at mars.nasa.gov
- [ ] Each rover is visually distinguishable by color
- [ ] Toggling a rover off removes its layers; toggling on restores them
- [ ] Waypoint click shows popup with sol number, Earth date, cumulative distance

---

### F3: Sol-by-Sol Traverse Animation (Priority: P0 — Hero Feature)

The marquee interaction: scrub through mission history and watch rovers move.

**Requirements:**
- R3.1: Timeline slider spanning sol 0 → current max sol for selected rover
- R3.2: Play/pause button with configurable playback speed (1x, 5x, 10x, 50x sols/second)
- R3.3: Progressive path reveal — only show traverse segments up to the selected sol
- R3.4: Camera follows the rover position during playback (optional: user can disengage)
- R3.5: Current sol indicator displayed prominently during playback
- R3.6: Step-through controls (previous sol / next sol) for frame-by-frame inspection
- R3.7: Animation state syncs with dashboard (F4) and photo gallery (F5)
- R3.8: Multi-rover mode: animate all rovers simultaneously, each at their own sol timeline
- R3.9: Slider supports click-to-seek (jump to any sol)

**Animation Engine Design:**
- Use `requestAnimationFrame` for smooth playback
- Filter GeoJSON features by `sol <= currentSol` using renderer/filter expressions
- Update a `GraphicsLayer` marker for current rover position each frame
- Emit custom events for sol changes so dashboard/photos can react

**Acceptance Criteria:**
- [ ] Slider scrubs smoothly across full mission timeline without jank
- [ ] Play/pause toggles animation; speed controls change frame rate
- [ ] Path reveals progressively — no future segments visible
- [ ] Camera tracks rover position during playback
- [ ] Dashboard and photo gallery update in sync with animation

---

### F4: Mission Dashboard (Priority: P1)

Real-time stats panel showing current mission state.

**Requirements:**
- R4.1: Display current sol number and corresponding Earth date for selected rover
- R4.2: Show total distance traveled (km and miles) at current sol
- R4.3: Mission duration (sols elapsed, Earth days elapsed)
- R4.4: Rover status (Active / Mission Complete)
- R4.5: Landing site name and coordinates
- R4.6: Current Mars weather from Curiosity REMS feed (temperature, pressure, opacity, season)
- R4.7: Weather data applies globally (single Curiosity station) — label accordingly
- R4.8: Sol-to-Earth date converter utility
- R4.9: Rover selector to switch active rover in dashboard context

**Weather Data Source:**
- URL: `https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json`
- No auth required
- Fields: sol, terrestrial_date, min_temp, max_temp, pressure, atmo_opacity, sunrise, sunset, ls, season
- Updates ~daily; cache for 1 hour client-side

**Acceptance Criteria:**
- [ ] Dashboard populates with correct stats for selected rover
- [ ] Weather widget shows latest available Curiosity REMS data
- [ ] Switching rovers updates all dashboard fields
- [ ] Stats update during animation playback

---

### F5: Rover Photo Gallery (Priority: P1)

Browse rover photos synced to the current sol/position.

**Requirements:**
- R5.1: Fetch photos from NASA Mars Rover Photos API for the current sol
- R5.2: Display photo thumbnails in a scrollable panel
- R5.3: Click thumbnail to show full-resolution image in a lightbox/dialog
- R5.4: Filter photos by camera (dropdown with rover-specific camera list)
- R5.5: Show photo metadata: camera name, Earth date, sol
- R5.6: Photos update when animation sol changes (debounced — don't fetch every frame)
- R5.7: Handle rate limiting gracefully — show cached data or "loading" state
- R5.8: BYOK API key dialog for users who want higher rate limits
- R5.9: Fallback to DEMO_KEY when no user key is provided

**API Details:**
- Endpoint: `GET https://api.nasa.gov/mars-photos/api/v1/rovers/{name}/photos?sol={sol}&api_key={key}`
- Rate limits: DEMO_KEY = 30/hour, registered key = 1000/hour
- Response: array of `{ id, sol, camera: { name, full_name }, img_src, earth_date, rover: {...} }`
- No location data in photo response — link to position via sol number from traverse data
- 25 photos per page; implement pagination if needed

**Camera Lists:**
- Perseverance: NAVCAM_LEFT, NAVCAM_RIGHT, MCZ_RIGHT, MCZ_LEFT, FRONT_HAZCAM_LEFT_A, FRONT_HAZCAM_RIGHT_A, REAR_HAZCAM_LEFT, REAR_HAZCAM_RIGHT, SKYCAM, SHERLOC_WATSON, EDL_RUCAM, EDL_RDCAM, EDL_DDCAM, EDL_PUCAM1, EDL_PUCAM2
- Curiosity: FHAZ, RHAZ, MAST, CHEMCAM, MAHLI, MARDI, NAVCAM
- Opportunity: FHAZ, RHAZ, NAVCAM, PANCAM, MINITES
- Spirit: FHAZ, RHAZ, NAVCAM, PANCAM, MINITES

**Acceptance Criteria:**
- [ ] Photos load for selected rover and sol
- [ ] Camera filter narrows results
- [ ] Lightbox displays full-res image with metadata
- [ ] Rate limit exceeded shows graceful degradation message
- [ ] BYOK dialog allows user to enter their NASA API key

---

### F6: Elevation Profile (Priority: P2)

Terrain analysis along rover traverse path.

**Requirements:**
- R6.1: Generate elevation profile along selected rover's traverse path
- R6.2: Use SceneView ground.queryElevation() to sample terrain heights
- R6.3: Display profile as a line chart (Calcite or lightweight chart library)
- R6.4: Highlight current sol position on the profile chart during animation
- R6.5: Show statistics: total ascent, total descent, min/max elevation, current elevation
- R6.6: Click on profile chart to jump to that point on the traverse

**Acceptance Criteria:**
- [ ] Elevation profile renders for selected rover
- [ ] Profile chart is readable and properly labeled (elevation in meters, distance in km)
- [ ] Current position marker moves on chart during animation
- [ ] Click-to-seek works bidirectionally (chart → map, map → chart)

---

## 5. Non-Functional Requirements

### Performance
- NFR-1: Initial page load < 8 seconds on broadband (globe + one rover traverse)
- NFR-2: Animation playback at 60fps (sol transitions may be lower — 30fps acceptable)
- NFR-3: Lazy-load inactive rover data — only fetch on user selection or "load all"

### Accessibility
- NFR-4: WCAG 2.1 Level AA compliance (Calcite baseline + custom components)
- NFR-5: Full keyboard navigation for all controls
- NFR-6: Screen reader labels on all interactive elements
- NFR-7: Color is never the sole means of rover differentiation (use labels + icons)

### Responsiveness
- NFR-8: Desktop-first layout with responsive breakpoints for tablet (768px) and mobile (480px)
- NFR-9: Touch gestures work for globe navigation on all devices
- NFR-10: Panels collapse to bottom sheet on mobile

### Reliability
- NFR-11: Graceful degradation when NASA APIs are unreachable (show cached/static data)
- NFR-12: Offline-capable for static data (Spirit, Opportunity traverses always work)
- NFR-13: Error boundaries — one failed API call doesn't crash the entire app

---

## 6. Data Source Summary

| Data | Source | Auth | Update Frequency | Format |
|---|---|---|---|---|
| Mars imagery | Esri Astro (astro.arcgis.com) | None | Static | Map tiles |
| Mars elevation | Esri Astro MDEM200M | None | Static | Image tiles |
| Perseverance traverse | NASA MMGIS M20 | None | Per-drive (~weekly) | GeoJSON |
| Curiosity traverse | NASA MMGIS MSL | None | Per-drive (~weekly) | GeoJSON |
| Spirit traverse | PDS Analyst's Notebook (pre-converted) | None | Static (mission ended) | Static GeoJSON |
| Opportunity traverse | PDS Analyst's Notebook (pre-converted) | None | Static (mission ended) | Static GeoJSON |
| Rover photos | NASA Mars Rover Photos API | API key (BYOK/DEMO) | Per-downlink | JSON |
| Mars weather | Curiosity REMS RSS feed | None | ~Daily | JSON |

---

## 7. Milestones

### M0: Project Bootstrap (Week 1)
- [ ] Initialize Vite + TypeScript + @arcgis/core project
- [ ] Configure Calcite Design System with dark mode
- [ ] Set up GitHub repo with CI/CD workflows
- [ ] Implement basic Mars 3D globe (F1: R1.1–R1.5)

### M1: Traverse Foundation (Week 2)
- [ ] Fetch and display Perseverance traverse (F2: R2.1–R2.2, R2.7)
- [ ] Implement MER coordinate transformation (F2: R2.6)
- [ ] Pre-convert Spirit/Opportunity CSV → GeoJSON, commit to repo
- [ ] Display all four rover paths on globe (F2: R2.3–R2.5)
- [ ] Rover toggle UI (F2: R2.9)

### M2: Animation Engine (Week 3)
- [ ] Sol timeline slider (F3: R3.1, R3.9)
- [ ] Play/pause with speed control (F3: R3.2)
- [ ] Progressive path reveal (F3: R3.3)
- [ ] Camera follow mode (F3: R3.4)
- [ ] Step-through controls (F3: R3.6)

### M3: Dashboard + Photos (Week 4)
- [ ] Mission stats panel (F4: R4.1–R4.5, R4.8–R4.9)
- [ ] Weather widget (F4: R4.6–R4.7)
- [ ] Photo gallery with camera filter (F5: R5.1–R5.6)
- [ ] BYOK API key dialog (F5: R5.8–R5.9)
- [ ] Animation ↔ Dashboard ↔ Photos sync (F3: R3.7)

### M4: Elevation + Polish (Week 5)
- [ ] Elevation profile (F6: R6.1–R6.6)
- [ ] Responsive layout (NFR-8–10)
- [ ] Accessibility audit (NFR-4–7)
- [ ] Performance optimization (NFR-1–3)
- [ ] README, social preview, GitHub Pages deploy

---

## 8. Out of Scope (v1)

- Ingenuity helicopter tracking (data available but deferred)
- 3D rover model placement on globe
- Multi-user / collaborative features
- Perseverance MEDA weather (no public API)
- Mars Trek WMTS integration (Esri Astro is sufficient)
- Offline PWA / service worker
- Any backend or server-side processing
