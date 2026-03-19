# CLAUDE.md — SolTracker

> A 3D Mars rover tracking application built with ArcGIS Maps SDK for JavaScript (v5.0), Calcite Design System, TypeScript, and Vite.
> Displays all four NASA Mars rovers (Perseverance, Curiosity, Opportunity, Spirit) on a 3D Mars globe with sol-by-sol traverse animation, live dashboard stats, rover photo galleries, and elevation profiling.

> **Note:** Do not include this file as indexable context. It is the entry point, not a reference doc.

Read this file completely before doing anything.
Then read `ai-dev/architecture.md` for full system design and data flow.
Then read `ai-dev/guardrails/` for hard constraints.

---

## Context Boundaries

This file is the AI entry point for this project.
Do NOT auto-scan or index the following:
- `ai-dev/`   (read specific files only when instructed)
- `CLAUDE.md` (this file — entry point only)

When a task requires architecture context: read `ai-dev/architecture.md` explicitly.
When a task requires constraints: read `ai-dev/guardrails/` explicitly.
When a task requires data schemas: read `ai-dev/field-schema.md` explicitly.
When a task requires domain patterns: read `ai-dev/skills/` explicitly.

---

## Workflow Protocol

When starting a new task:
1. Read CLAUDE.md (this file)
2. Read `ai-dev/architecture.md`
3. Read `ai-dev/guardrails/` — constraints override all other guidance
4. Check `ai-dev/decisions/` for prior decisions affecting your work
5. Check `ai-dev/skills/` for domain patterns specific to this project
6. **Before implementing any API integration**: use browser to verify the endpoint is live and schema matches `ai-dev/field-schema.md`
7. **Before writing ArcGIS code**: use browser to fetch the current API reference for the specific class/component

Plan before building. Show the plan. Wait for confirmation before writing code.

---

## Browser Tool Access

Chrome browser access is enabled for this project. Use it actively during development for:

### API Verification
- **Validate MMGIS endpoints** — open `https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json` directly in browser to inspect response schema, confirm field names, and check for schema changes before coding against them.
- **Test NASA Photos API** — hit `https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=DEMO_KEY` to verify response structure matches `ai-dev/field-schema.md`.
- **Check REMS weather feed** — load `https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json` to confirm the feed is still active and inspect current data.
- **Verify Esri Astro services** — browse `https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer` REST endpoint to confirm availability and spatial reference info.

### ArcGIS SDK Documentation Lookup
- **Always fetch current docs** before writing ArcGIS code — browse `https://developers.arcgis.com/javascript/latest/api-reference/` for class signatures, component attributes, and breaking changes.
- **Check Mars sample code** — `https://developers.arcgis.com/javascript/latest/sample-code/mars/` for the canonical Mars SceneView pattern.
- **Calcite component docs** — `https://developers.arcgis.com/calcite-design-system/components/` for props, slots, and event names.

### Dev Server Testing
- After `npm run dev`, open `http://localhost:5173` in the browser to:
  - Visually verify the Mars globe renders correctly
  - Check that rover traverses display at expected positions
  - Test animation playback and UI responsiveness
  - Inspect console for errors, warnings, and failed network requests
  - Verify Calcite dark mode styling and layout

### Data Exploration
- **PDS Analyst's Notebook** — browse `https://an.rsl.wustl.edu/` to explore rover traverse data, verify MER CSV formats, and cross-reference waypoint positions.
- **NASA Mars Trek** — `https://trek.nasa.gov/mars/` as visual reference for comparing tile coverage and layer accuracy.
- **Esri Explore Mars** — `https://esri.github.io/explore-mars/` as the reference implementation to compare SceneView behavior.

### When to Use Browser vs. CLI
- Use browser when you need to **see** something: rendered map output, visual layout, API response inspection, documentation lookup.
- Use CLI (`curl`, `node`) when you need to **script** something: batch data fetching, JSON transformation, build tooling.
- Prefer browser for Esri docs — the API reference has interactive examples that render better in-browser than as raw HTML.

---

## Compatibility Matrix

| Component | Version | Notes |
|---|---|---|
| Node.js | 20 LTS+ | Required for Vite dev server and build |
| TypeScript | 5.5+ | Strict mode enabled |
| Vite | 6.x | Build tool, dev server on localhost:5173 |
| @arcgis/core | 5.0.x | ArcGIS Maps SDK for JavaScript |
| @arcgis/map-components | 5.0.x | Web components (<arcgis-scene>, etc.) |
| @esri/calcite-components | 3.x | Calcite Design System UI components |
| Spatial Reference | ESRI:104971 | Mars_2000_(Sphere), WKID 104971 |

---

## Project Structure

```
soltracker/
├── CLAUDE.md                           # This file — AI entry point
├── README.md                           # Human-facing project description
├── LICENSE                             # Apache-2.0
├── CHANGELOG.md                        # Keep a Changelog format
├── CONTRIBUTING.md                     # Contribution guidelines
├── CODE_OF_CONDUCT.md                  # Contributor Covenant 2.1
├── SECURITY.md                         # Vulnerability reporting policy
├── .gitignore
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                      # Lint + type-check + build
│   │   └── deploy.yml                  # GitHub Pages deployment
│   └── dependabot.yml                  # Dependency updates
├── ai-dev/
│   ├── architecture.md                 # System design, data flow, module interfaces
│   ├── spec.md                         # Full requirements + acceptance criteria
│   ├── field-schema.md                 # All data models and API response schemas
│   ├── patterns.md                     # Code patterns and anti-patterns
│   ├── prompt-templates.md             # Reusable prompts for common tasks
│   ├── agents/
│   │   ├── README.md                   # Agent inventory
│   │   ├── architect.md                # System design agent
│   │   ├── typescript_expert.md        # TS/Vite/ArcGIS JS patterns
│   │   ├── data_expert.md              # NASA API + GeoJSON data pipeline
│   │   ├── frontend_expert.md          # Calcite + responsive UI
│   │   ├── qa_reviewer.md              # Testing and quality
│   │   └── technical_writer.md         # Docs, README, CHANGELOG
│   ├── decisions/
│   │   ├── DL-001-spatial-reference.md
│   │   ├── DL-002-data-strategy.md
│   │   ├── DL-003-ui-framework.md
│   │   ├── DL-004-build-tooling.md
│   │   ├── DL-005-api-key-strategy.md
│   │   └── DL-006-rover-colors.md
│   ├── skills/
│   │   ├── README.md
│   │   ├── mars-sceneview-skill.md     # Mars 3D globe configuration patterns
│   │   ├── nasa-api-skill.md           # NASA API integration patterns
│   │   └── calcite-dashboard-skill.md  # Calcite layout and responsive patterns
│   └── guardrails/
│       ├── README.md
│       ├── coding-standards.md
│       ├── data-handling.md
│       └── accessibility.md
├── index.html                          # App entry point
├── vite.config.ts                      # Vite configuration
├── tsconfig.json                       # TypeScript strict config
├── package.json
└── src/
    ├── main.ts                         # App bootstrap, SceneView init
    ├── config.ts                       # API keys, service URLs, rover metadata
    ├── types.ts                        # Shared TypeScript interfaces
    ├── features/
    │   ├── mars-globe/
    │   │   ├── mars-scene.ts           # SceneView + Mars imagery/elevation setup
    │   │   └── mars-layers.ts          # Layer factory (imagery, DEM, nomenclature)
    │   ├── traverse/
    │   │   ├── traverse-loader.ts      # Hybrid data loader (live fetch + static GeoJSON)
    │   │   ├── traverse-renderer.ts    # GeoJSONLayer styling per rover
    │   │   ├── traverse-animation.ts   # Sol-by-sol playback engine
    │   │   └── coordinate-transform.ts # MER site-frame → areocentric conversion
    │   ├── dashboard/
    │   │   ├── dashboard-panel.ts      # Current sol stats, mission summary
    │   │   ├── weather-widget.ts       # Curiosity REMS weather display
    │   │   └── sol-counter.ts          # Sol calculator (Earth date ↔ Mars sol)
    │   ├── photos/
    │   │   ├── photo-service.ts        # NASA Mars Photos API client
    │   │   ├── photo-gallery.ts        # Image carousel synced to sol/position
    │   │   └── camera-filter.ts        # Camera selection UI
    │   └── elevation/
    │       ├── elevation-profile.ts    # Elevation analysis along traverse
    │       └── terrain-stats.ts        # Min/max/total climb statistics
    ├── services/
    │   ├── nasa-api.ts                 # Centralized NASA API client (rate limiting, caching)
    │   └── mmgis-client.ts             # NASA MMGIS GeoJSON fetcher
    ├── utils/
    │   ├── sol-date.ts                 # Sol ↔ Earth date conversion math
    │   ├── animation-timer.ts          # requestAnimationFrame-based playback loop
    │   └── format.ts                   # Number/date formatting helpers
    ├── data/
    │   ├── spirit-traverse.geojson     # Static: pre-converted from PDS CSV
    │   ├── opportunity-traverse.geojson # Static: pre-converted from PDS CSV
    │   └── rover-metadata.json         # Landing dates, coordinates, camera lists, colors
    └── styles/
        ├── main.css                    # Global styles, Calcite dark mode
        └── components.css              # Feature-specific component styles
```

---

## Critical Conventions

### ArcGIS JS SDK v5.0

- **Web components only** — all widgets are deprecated at 5.0. Use `<arcgis-scene>`, `<arcgis-zoom>`, etc. Never use `new SceneView()` widget pattern for map/scene initialization; use the component.
- **Mars spatial reference** — set `spatialReference: { wkid: 104971 }` on the scene element. The SDK auto-adjusts globe diameter and atmosphere. Never use `"world-elevation"` preset (Earth-only).
- **Layer loading is lazy** — always `await layer.load()` or check `layer.loaded` before accessing properties.
- **Reactive utilities** — use `reactiveUtils.watch()` for property observation. `watchUtils` is removed.
- **Geometry operators** — use `@arcgis/core/geometry/operators/`. `geometryEngine` is deprecated at 5.0.
- **Assets load from CDN by default** — no local asset copying needed. The projection engine WASM (~3MB) loads on-demand when Mars CRS is used.

### Mars-Specific Constraints

- **No VectorTileLayer** on Mars — explicitly unsupported by the SDK.
- **No SceneLayer (I3S)** on Mars — explicitly unsupported.
- **No portal save** — Mars scenes cannot be saved as portal items.
- **Daylight rendering** — displays incorrectly on Mars; disable or ignore.
- **WKID 104971 vs 104905** — use 104971 (spherical). It matches the official sample and Esri Astro services. 104905 (ellipsoidal) is more accurate but less tested.

### TypeScript

- Strict mode: `strict: true` in tsconfig.json.
- Explicit return types on all exported functions.
- No `any` — use `unknown` with type guards when type is genuinely unknown.
- Prefer `interface` over `type` for object shapes that may be extended.

### Code Style

- All exported functions and classes get JSDoc comments.
- Error handling: try/catch on all async operations, especially NASA API calls and layer loading.
- Logging: use `console.warn` for recoverable errors, `console.error` for failures.
- No bare `console.log` in production code — use only for debug during development.

---

## Architecture Summary

SolTracker is a **static single-page application** deployed to GitHub Pages. It renders a 3D Mars globe using ArcGIS SceneView with the Mars_2000_Sphere CRS (WKID 104971), overlaying rover traverse paths from NASA MMGIS GeoJSON endpoints (Perseverance, Curiosity) and pre-converted static GeoJSON (Spirit, Opportunity).

The hero feature is **sol-by-sol traverse animation**: a timeline slider + play/pause controls that progressively reveal each rover's path, syncing the SceneView camera, dashboard stats, and photo gallery to the selected sol.

Data sources are all **client-side fetched** — no backend. NASA APIs use a BYOK key strategy with DEMO_KEY fallback. Mars imagery and elevation tiles are served from Esri Astro (astro.arcgis.com) with no authentication required.

Detailed design: see `ai-dev/architecture.md`.

---

## Hard Constraints

Read `ai-dev/guardrails/` before writing ANY code. Guardrails override all other instructions.

Key constraints:
- **No API keys in source code** — all keys via environment variables or runtime BYOK dialog.
- **No backend/server** — everything runs client-side for GitHub Pages deployment.
- **Apache 2.0 license** — all generated code must be compatible.
- **WCAG 2.1 AA** — Calcite provides baseline; maintain keyboard nav and color contrast.
- **Rate limiting** — NASA DEMO_KEY allows only 30 req/hour. Implement client-side throttling.

---

## What NOT To Do

- Do not use `new MapView()` or `new SceneView()` — use `<arcgis-scene>` web component.
- Do not use `watchUtils` — removed in 5.0. Use `reactiveUtils`.
- Do not use `geometryEngine` — deprecated. Use geometry operators.
- Do not hardcode NASA API keys or Esri API keys anywhere in source.
- Do not assume Mars tile services require authentication — they are public.
- Do not use VectorTileLayer or SceneLayer on Mars — unsupported.
- Do not set `ground: "world-elevation"` for Mars — it's Earth-only.
- Do not rely on training memory for ArcGIS API signatures — **use browser to fetch docs first**.
- Do not generate complete feature implementations — start with skeleton + TODO markers.
- Do not refactor or suggest improvements unless explicitly asked.
- Do not assume NASA API response schemas are stable — **verify with browser before coding against them**.
- Do not skip visual verification — after implementing any UI feature, **open localhost:5173 in browser** to confirm rendering.

---

## Service URLs Quick Reference

```typescript
// Mars Elevation (ElevationLayer for ground)
const MARS_DEM_URL = "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer";

// Mars Imagery Basemaps (TileLayer)
const MARS_VIKING_URL = "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer";
const MARS_SHADED_RELIEF_URL = "https://astro.arcgis.com/arcgis/rest/services/OnMars/MColorDEM/MapServer";

// Perseverance MMGIS (live GeoJSON)
const M20_WAYPOINTS_URL = "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json";
const M20_TRAVERSE_URL = "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json";

// Curiosity MMGIS (live GeoJSON)
const MSL_WAYPOINTS_URL = "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json";
const MSL_TRAVERSE_URL = "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json";

// NASA Mars Rover Photos API
const NASA_PHOTOS_BASE = "https://api.nasa.gov/mars-photos/api/v1";

// Curiosity REMS Weather (JSON, no auth)
const REMS_WEATHER_URL = "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json";
```

---

## Rover Metadata Quick Reference

| Rover | Status | Landing Date | Landing Lat | Landing Lon (°E) | Location | Color Hex |
|---|---|---|---|---|---|---|
| Perseverance | Active | 2021-02-18 | 18.4446° | 77.4509° | Jezero Crater | `#E03C31` |
| Curiosity | Active | 2012-08-06 | -4.5895° | 137.4417° | Gale Crater | `#3A7BD5` |
| Opportunity | Ended 2019 | 2004-01-25 | -1.9462° | 354.4734° (→ -5.5266°) | Meridiani Planum | `#D4A843` |
| Spirit | Ended 2010 | 2004-01-04 | -14.5692° | 175.4729° | Gusev Crater | `#2E8B57` |

Note: Opportunity longitude 354.47°E → -5.53° in ±180° convention for ArcGIS.
