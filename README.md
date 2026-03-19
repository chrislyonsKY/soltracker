# SolTracker

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![ArcGIS](https://img.shields.io/badge/ArcGIS_JS_SDK-5.0-2C7AC3?logo=esri&logoColor=white)](https://developers.arcgis.com/javascript/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222?logo=github)](https://chrislyonsky.github.io/soltracker/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Track all four NASA Mars rovers on a 3D globe with sol-by-sol traverse animation, live dashboard stats, rover photos, and terrain analysis.**

SolTracker is a static single-page application that renders a photorealistic 3D Mars globe using the ArcGIS Maps SDK for JavaScript, overlaid with real traverse data from NASA's Perseverance, Curiosity, Opportunity, and Spirit rovers. Scrub through mission history sol-by-sol, watch traverse paths animate across the Martian surface, explore rover photos, and analyze terrain profiles — all running client-side with zero backend.

---

## Features

### Core

| Feature | Description |
|---------|-------------|
| **Mars 3D Globe** | ArcGIS SceneView with Mars_2000_Sphere CRS (WKID 104971), Viking MDIM imagery, MDEM200M elevation |
| **Rover Traverses** | Live MMGIS data for Perseverance & Curiosity, static GeoJSON for Spirit & Opportunity |
| **Sol Animation** | Play/pause, step, speed control (1-50x), camera follow, keyboard shortcuts |
| **3D Rover Models** | Official NASA GLB models placed at each rover's current position |
| **Mission Dashboard** | Current sol, Earth date, distance, status, landing site |
| **Mars Weather** | Curiosity REMS data: temperature, pressure, opacity, season |
| **Photo Gallery** | NASA Mars Photos API with camera filter, lightbox, BYOK API key |
| **Elevation Profile** | SVG terrain chart with min/max/ascent/descent stats |

### Advanced

| Feature | Description |
|---------|-------------|
| **Cinematic Fly-Through** | Drone-style camera animation along traverse paths |
| **Mars Dual Clock** | Real-time MTC, LMST at rover longitude, current sol counter |
| **Drive Analytics** | Driving/idle sols, longest drive, cumulative distance chart |
| **DSN Live Status** | Deep Space Network antenna-to-rover communication links |
| **Sample Map** | Perseverance sample tube collection and depot locations |
| **Ingenuity Tracking** | Helicopter flight paths and waypoints from MMGIS |
| **This Sol in History** | Cross-rover milestone comparison at any sol number |
| **Geological Overlays** | Mars Trek WMTS layers: thermal inertia, MOLA hillshade, THEMIS IR |
| **Earth Scale Compare** | Place Kentucky, Texas, France, or Japan on Mars |
| **Terrain Difficulty** | Per-segment slope analysis and classification |
| **Raw Image Feed** | Latest unprocessed downlink images, auto-refresh |
| **Panorama Viewer** | Curated 360-degree mosaics from all four rovers |
| **URL Deep-Linking** | Shareable URLs with rover, sol, and camera position |

---

## Quick Start

```bash
git clone https://github.com/chrislyonsKY/soltracker.git
cd soltracker
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The Mars globe renders immediately with live rover traverse data.

### NASA API Key (Optional)

Photos are fetched using NASA's `DEMO_KEY` by default (30 requests/hour). For higher limits:

1. Get a free key at [api.nasa.gov](https://api.nasa.gov)
2. Click the gear icon in SolTracker
3. Enter your key — it's stored in your browser's localStorage only

---

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| [TypeScript](https://www.typescriptlang.org/) | 5.5+ | Language (strict mode) |
| [Vite](https://vitejs.dev/) | 6.x | Build tool & dev server |
| [@arcgis/core](https://developers.arcgis.com/javascript/) | 5.0 | 3D Mars globe rendering |
| [@arcgis/map-components](https://developers.arcgis.com/javascript/) | 5.0 | Web components (`<arcgis-scene>`) |
| [Calcite Design System](https://developers.arcgis.com/calcite-design-system/) | 5.x | UI components (dark mode) |

---

## Data Sources

| Data | Source | Auth |
|------|--------|------|
| Mars imagery & elevation | [Esri Astro](https://astro.arcgis.com) | None |
| Perseverance/Curiosity traverse | [NASA MMGIS](https://mars.nasa.gov/mmgis-maps/) | None |
| Spirit/Opportunity traverse | PDS Analyst's Notebook (pre-converted) | None |
| Rover photos | [NASA Mars Photos API](https://api.nasa.gov) | DEMO_KEY / BYOK |
| Mars weather | [Curiosity REMS RSS](https://mars.nasa.gov/rss/api/) | None |
| DSN status | [DSN Now](https://eyes.nasa.gov/dsn/) | None |
| Geological tiles | [Mars Trek WMTS](https://trek.nasa.gov/tiles/) | None |
| 3D rover models | [NASA 3D Resources](https://mars.nasa.gov) | None |
| Ingenuity flights | [NASA MMGIS](https://mars.nasa.gov/mmgis-maps/) | None |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause animation |
| `Arrow Right` | Step to next waypoint |
| `Arrow Left` | Step to previous waypoint |

---

## Project Structure

```
soltracker/
├── index.html                     # App entry point
├── src/
│   ├── main.ts                    # Bootstrap & feature orchestration
│   ├── config.ts                  # Service URLs, rover metadata, API keys
│   ├── types.ts                   # Shared TypeScript interfaces
│   ├── features/
│   │   ├── mars-globe/            # SceneView, layers
│   │   ├── traverse/              # Loader, renderer, animation, 3D models, Ingenuity
│   │   ├── dashboard/             # Stats, weather, clock, DSN, analytics
│   │   ├── photos/                # Gallery, camera filter, raw images, panoramas
│   │   ├── elevation/             # Profile chart, terrain stats
│   │   ├── samples/               # Sample collection map
│   │   ├── overlays/              # Geological layers, Earth scale
│   │   └── url-state.ts           # URL deep-linking
│   ├── services/                  # NASA API, MMGIS client
│   ├── utils/                     # Sol-date math, formatting, animation timer
│   ├── data/                      # Static GeoJSON, milestones
│   └── styles/                    # CSS
└── ai-dev/                        # Architecture docs, specs, decisions
```

---

## Rover Colors

| Rover | Color | Status |
|-------|-------|--------|
| Perseverance | `#E03C31` | Active (Jezero Crater) |
| Curiosity | `#3A7BD5` | Active (Gale Crater) |
| Opportunity | `#D4A843` | Ended 2019 (Meridiani Planum) |
| Spirit | `#2E8B57` | Ended 2010 (Gusev Crater) |
| Ingenuity | `#9B59B6` | Ended 2024 (Jezero Crater) |

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/` — deploy to any static host (GitHub Pages, Netlify, Vercel).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[Apache License 2.0](LICENSE) — Copyright 2026 Chris Lyons

## Acknowledgments

- **NASA/JPL-Caltech** — Mars rover data, photos, 3D models, and MMGIS
- **Esri** — ArcGIS Maps SDK, Astro planetary services, Calcite Design System
- **USGS Astrogeology** — Mars geological data and tile services
