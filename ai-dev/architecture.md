# SolTracker — Architecture

**Last Updated:** 2026-03-19

---

## System Overview

SolTracker is a **static single-page application** with zero backend. All data is fetched client-side from public NASA and Esri services. The app renders a 3D Mars globe using the ArcGIS Maps SDK for JavaScript (v5.0) SceneView web component, overlaid with rover traverse data, and surrounded by Calcite Design System UI panels.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐  ┌───────────┐ │
│  │  Calcite UI  │  │   <arcgis-scene>          │  │  Calcite  │ │
│  │  Left Panel  │  │   Mars Globe (WKID 104971)│  │  Right    │ │
│  │              │  │                            │  │  Panel    │ │
│  │ • Rover      │  │  ┌─ TileLayer (imagery)   │  │           │ │
│  │   Selector   │  │  ├─ ElevationLayer (DEM)  │  │ • Photos  │ │
│  │ • Animation  │  │  ├─ GeoJSONLayer ×4       │  │ • Elev.   │ │
│  │   Controls   │  │  │  (rover traverses)     │  │   Profile │ │
│  │ • Dashboard  │  │  └─ GraphicsLayer          │  │           │ │
│  │ • Weather    │  │     (current position)     │  │           │ │
│  └──────────────┘  └──────────────────────────┘  └───────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Bottom: Sol Timeline Slider                    │ │
│  │  ◀ ▶ ⏸  ───────────●────────────────────  Sol 1432 / 1823 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐  ┌─────────────────┐  ┌────────────────────┐
│ Esri Astro   │  │ NASA MMGIS      │  │ NASA APIs          │
│ (no auth)    │  │ (no auth)       │  │ (BYOK / DEMO_KEY)  │
│              │  │                 │  │                    │
│ • MDEM200M   │  │ • M20 waypoints │  │ • Mars Photos API  │
│ • MDIM tiles │  │ • M20 traverse  │  │ • REMS Weather RSS │
│ • MColorDEM  │  │ • MSL waypoints │  │                    │
│              │  │ • MSL traverse  │  │                    │
└──────────────┘  └─────────────────┘  └────────────────────┘

Static Data (in repo):
• spirit-traverse.geojson
• opportunity-traverse.geojson
• rover-metadata.json
```

---

## Module Architecture

### Core Modules

#### `src/main.ts` — App Bootstrap
- Entry point. Imports Calcite and ArcGIS component loaders.
- Initializes the `<arcgis-scene>` element with Mars spatial reference.
- Orchestrates feature module initialization in sequence:
  1. Mars globe (F1)
  2. Traverse loader (F2)
  3. Animation engine (F3)
  4. Dashboard (F4)
  5. Photo gallery (F5)
  6. Elevation profile (F6)

#### `src/config.ts` — Configuration Registry
- All service URLs as named constants (see CLAUDE.md quick reference)
- Rover metadata: landing dates, coordinates, camera lists, colors, status
- API key management: read from localStorage, provide setter for BYOK dialog
- Feature flags for optional capabilities

#### `src/types.ts` — Shared Type Definitions
- `RoverName`: `'perseverance' | 'curiosity' | 'opportunity' | 'spirit'`
- `RoverConfig`: metadata interface (name, color, landingDate, landingLat, landingLon, status, cameras)
- `WaypointProperties`: interface matching MMGIS GeoJSON schema
- `PhotoResult`: interface matching NASA Photos API response
- `WeatherReport`: interface matching REMS RSS response
- `AnimationState`: current sol, playing, speed, active rover
- `SolChangeEvent`: custom event payload for cross-feature sync

---

### Feature Modules

#### `src/features/mars-globe/`

**mars-scene.ts**
- Creates and configures the `<arcgis-scene>` web component
- Sets `spatialReference: { wkid: 104971 }`
- Adds Mars ground (ElevationLayer) and basemap layers (TileLayer)
- Provides `flyTo(lat, lon, zoom)` helper for camera navigation
- Exposes the SceneView reference for other modules

**mars-layers.ts**
- Factory functions for creating Mars-specific layers:
  - `createMarsElevation()` → ElevationLayer
  - `createMarsImagery()` → TileLayer (Viking MDIM)
  - `createMarsShadedRelief()` → TileLayer (HRSC/MOLA)
- Handles layer load errors gracefully

#### `src/features/traverse/`

**traverse-loader.ts**
- Hybrid loading strategy:
  - Active rovers (Perseverance, Curiosity): fetch from MMGIS endpoints
  - Retired rovers (Spirit, Opportunity): import from `src/data/*.geojson`
- Returns normalized `FeatureCollection` per rover with consistent schema
- Caches fetched data in memory for session duration

**traverse-renderer.ts**
- Creates `GeoJSONLayer` per rover with mission-branded styling
- Line renderer: rover color, 3px width, with sol-based definition expression for animation
- Point renderer: waypoint markers with sol labels at high zoom
- Current position marker: distinct symbol (pulsing dot or rover icon) via GraphicsLayer

**traverse-animation.ts** (Hero Feature Engine)
- State: `{ currentSol, isPlaying, speed, activeRover }`
- `play()` / `pause()` / `setSpeed()` / `seekTo(sol)` / `stepForward()` / `stepBack()`
- Uses `requestAnimationFrame` loop; increments sol based on speed and elapsed time
- Updates GeoJSONLayer definitionExpression: `sol <= ${currentSol}`
- Moves current-position graphic to the waypoint matching currentSol
- Emits `sol-change` CustomEvent on `document` for dashboard/photos to subscribe
- Camera follow: optionally calls `view.goTo()` on each sol change

**coordinate-transform.ts**
- `siteFrameToAreocentric(x, y, landerLat, landerLon)` → `{ lat, lon }`
- Uses planar approximation: `Δlat = y / 59274.5`, `Δlon = x / (59274.5 × cos(landerLat_rad))`
- One-time use: for pre-converting MER CSV to GeoJSON (build-time script, not runtime)

#### `src/features/dashboard/`

**dashboard-panel.ts**
- Listens for `sol-change` events
- Updates Calcite block elements with: current sol, Earth date, distance, duration, status
- Rover selector (Calcite segmented control or tabs) switches active rover context

**weather-widget.ts**
- Fetches REMS weather JSON on load, caches for 1 hour
- Displays: sol, date, min/max temp (°C), pressure (Pa), atmospheric opacity, season
- Labels clearly: "Weather at Gale Crater (Curiosity REMS)" — it's a single station

**sol-counter.ts**
- Sol-to-Earth date math:
  - Mars sol = 24h 39m 35.244s = 88775.244 Earth seconds
  - Perseverance Sol 0 = 2021-02-18
  - Curiosity Sol 0 = 2012-08-06
  - Opportunity Sol 0 = 2004-01-25
  - Spirit Sol 0 = 2004-01-04
- `solToEarthDate(rover, sol)` → Date
- `earthDateToSol(rover, date)` → number

#### `src/features/photos/`

**photo-service.ts**
- Wraps NASA Mars Rover Photos API
- `getPhotos(rover, sol, camera?, page?)` → Promise<PhotoResult[]>
- Client-side rate limiter: queue requests, respect 30/hour DEMO_KEY limit
- Caches responses by (rover, sol, camera) key in Map

**photo-gallery.ts**
- Subscribes to `sol-change` events (debounced — fetch after 500ms of no change)
- Renders thumbnails in a Calcite list or card grid
- Click opens Calcite dialog with full-res image + metadata
- Empty state: "No photos available for this sol"

**camera-filter.ts**
- Dropdown populated from rover-specific camera list
- "All cameras" default
- Selection triggers re-fetch with camera parameter

#### `src/features/elevation/`

**elevation-profile.ts**
- Takes traverse polyline geometry for active rover
- Samples elevation via `sceneView.ground.queryElevation()` at intervals
- Renders line chart (consider lightweight lib or Calcite chart if available)
- Marks current sol position on chart
- Click-on-chart → seek to that sol

**terrain-stats.ts**
- Computes: total ascent, total descent, min/max elevation
- Updates on rover selection change

---

### Service Modules

#### `src/services/nasa-api.ts`
- Centralized HTTP client for NASA APIs
- API key management: `getApiKey()` checks localStorage → falls back to DEMO_KEY
- `setApiKey(key)` saves to localStorage
- Rate limiting: token bucket algorithm, 30 tokens/hour for DEMO, 1000 for registered
- Request queue: if rate limited, queue and retry after cooldown
- Error handling: 429 → rate limit message, network errors → fallback UI

#### `src/services/mmgis-client.ts`
- Fetch wrapper for NASA MMGIS GeoJSON endpoints
- `getWaypoints(mission: 'M20' | 'MSL')` → Promise<FeatureCollection>
- `getTraverse(mission: 'M20' | 'MSL')` → Promise<FeatureCollection>
- Retry logic: 3 attempts with exponential backoff
- Cache in memory for session

---

### Utility Modules

#### `src/utils/sol-date.ts`
- Mars sol duration constant: 88775.244 seconds
- Per-rover epoch dates
- Bidirectional conversion functions

#### `src/utils/animation-timer.ts`
- `requestAnimationFrame`-based timer with configurable tick rate
- `start()`, `stop()`, `setTickRate()`, `onTick(callback)`
- Handles tab visibility (pause when hidden)

#### `src/utils/format.ts`
- `formatDistance(meters)` → "12.4 km (7.7 mi)"
- `formatTemperature(celsius)` → "-64°C (-83°F)"
- `formatSol(sol)` → "Sol 1,432"
- `formatDate(date)` → "Mar 19, 2026"

---

## Data Flow: Sol Animation

```
User drags slider → traverse-animation.seekTo(sol)
    │
    ├─→ Update GeoJSONLayer definitionExpression (sol <= N)
    ├─→ Move current-position Graphic to waypoint at sol N
    ├─→ Camera.goTo(waypoint position) [if follow mode]
    ├─→ Emit CustomEvent('sol-change', { rover, sol })
    │       │
    │       ├─→ dashboard-panel.ts updates stats
    │       ├─→ photo-gallery.ts fetches photos (debounced)
    │       └─→ elevation-profile.ts moves chart marker
    └─→ Update slider UI position
```

---

## Layout Architecture

Full-immersive design: globe fills viewport, floating Calcite panels overlay.

```
┌──────────────────────────────────────────────────────────────┐
│ ┌─action-bar──┐                                              │
│ │ 🔴 Persev.  │  ┌─────────────────────────────────────────┐ │
│ │ 🔵 Curiosity│  │                                         │ │
│ │ 🟡 Opport.  │  │         <arcgis-scene>                  │ │
│ │ 🟢 Spirit   │  │         Mars 3D Globe                   │ │
│ │─────────────│  │         (fills viewport)                │ │
│ │ ⚙️ Settings │  │                                         │ │
│ │ ℹ️ About    │  │                                         │ │
│ └─────────────┘  │                          ┌────────────┐ │ │
│                   │                          │  Dashboard │ │ │
│                   │                          │  Panel     │ │ │
│                   │                          │  (floating)│ │ │
│                   │                          └────────────┘ │ │
│                   └─────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │  ◀ ▶ ⏸  1x ▼  ─────────────●──────────  Sol 1432/1823  │  │
│ └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Responsive Breakpoints:**
- Desktop (>1024px): Action bar left, dashboard panel floating right, timeline bottom
- Tablet (768–1024px): Action bar collapses to icons, panels slide from edges
- Mobile (<768px): Bottom sheet for panels, simplified timeline, no elevation profile

**Calcite Layout Components:**
- `<calcite-shell>` — app container
- `<calcite-shell-panel>` — collapsible side panels
- `<calcite-action-bar>` — rover selector + tools
- `<calcite-panel>` — dashboard content
- `<calcite-block>` — collapsible sections within panels
- `<calcite-slider>` — sol timeline (or custom for more control)
- `<calcite-dialog>` — photo lightbox, BYOK settings

---

## Error Handling Strategy

| Error | Response |
|---|---|
| MMGIS fetch fails | Show cached data if available; show banner "Live data unavailable" |
| NASA Photos API 429 | Show "Rate limit reached" message; suggest BYOK key |
| NASA Photos API timeout | Show "Loading..." with retry button |
| Esri tile service 404 | Fallback to alternate basemap; log warning |
| Mars DEM load failure | Flat globe (no terrain) with warning banner |
| Invalid GeoJSON | Skip malformed features; log count of skipped |
| Browser WebGL unsupported | Show error page: "3D rendering requires WebGL" |

---

## Security Considerations

- No sensitive data flows through this app
- NASA API keys stored in localStorage (user's browser only, never transmitted to third parties)
- DEMO_KEY is rate-limited but not secret — it's NASA's public fallback
- No cookies, no analytics, no tracking (unless user opts in later)
- All external fetches over HTTPS
- CSP headers recommended for GitHub Pages deployment
