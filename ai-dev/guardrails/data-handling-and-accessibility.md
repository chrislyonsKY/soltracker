# Data Handling Guardrails

## API Keys

- **NEVER hardcode API keys in source code** — not in TypeScript, not in HTML, not in config files.
- NASA API key: read from localStorage at runtime via `getApiKey()` in `src/services/nasa-api.ts`.
- Esri API key (if used): read from localStorage or environment variable, never inline.
- `DEMO_KEY` string is the only key literal allowed in source — it's NASA's public fallback, not a secret.

## Rate Limiting

- NASA DEMO_KEY: **30 requests per hour per IP**. Enforce client-side.
- NASA registered key: **1,000 requests per hour**. Still enforce client-side throttling.
- Implement token bucket or sliding window rate limiter in `src/services/nasa-api.ts`.
- Queue requests when rate-limited; show user-facing message, not silent failure.
- Cache all API responses by composite key (rover + sol + camera) to minimize repeat requests.

## External Data Fetching

- All external fetches must use HTTPS.
- All fetch calls must have timeout handling (AbortController, 15-second default).
- All fetch calls must handle network errors gracefully — never let a fetch rejection crash the app.
- Retry logic: max 3 attempts with exponential backoff (1s, 2s, 4s) for MMGIS and weather endpoints.
- No retry on NASA Photos API 429 — that's rate limiting, not a transient error.

## Data Validation

- Validate GeoJSON structure before passing to GeoJSONLayer — check for `type`, `features` array.
- Validate waypoint coordinates are within Mars bounds: lat [-90, 90], lon [-180, 180].
- Validate sol numbers are non-negative integers.
- Skip malformed features rather than crashing — log count of skipped features.

## Caching Strategy

- MMGIS GeoJSON: cache in memory for session duration (data changes ~weekly).
- NASA Photos: cache by (rover, sol, camera) key in a Map; no TTL (photos don't change).
- REMS Weather: cache for 1 hour (data updates ~daily).
- Static GeoJSON (Spirit, Opportunity): loaded once, held in memory permanently.
- No persistent caching (no IndexedDB, no service worker) in v1.

## Privacy

- No user data is collected, stored, or transmitted.
- API keys stored in localStorage are the user's own keys, on their own device.
- No analytics, no cookies, no tracking pixels.
- No third-party scripts beyond ArcGIS CDN and NASA APIs.

---

# Accessibility Guardrails

## WCAG 2.1 Level AA Baseline

Calcite Design System provides the accessibility foundation. These guardrails ensure custom code maintains that standard.

## Color

- Color must **never** be the sole means of conveying information.
- All four rover colors must be supplemented with labels, icons, or line styles.
- Ensure minimum 4.5:1 contrast ratio for text on dark background.
- Ensure minimum 3:1 contrast ratio for UI components and graphical objects.
- Test all custom colors against both dark and light Calcite modes.

## Keyboard Navigation

- All interactive elements must be keyboard-accessible (Tab, Enter, Space, Escape).
- The sol slider must support keyboard input (arrow keys for step, Home/End for min/max).
- Play/pause controls must respond to Space bar.
- Focus indicators must be visible on all interactive elements.
- No keyboard traps — Escape always closes modals/dialogs.

## Screen Readers

- All `<img>` elements must have `alt` text (including rover photos in gallery).
- All icon-only buttons must have `aria-label` or visible text alternative.
- Map content is inherently visual — provide text summary of current state in dashboard panel.
- Announce sol changes during animation via `aria-live="polite"` region.
- Calcite components handle most ARIA internally — don't add conflicting attributes.

## Motion

- Respect `prefers-reduced-motion` media query: disable auto-play animation, reduce camera transitions.
- Animation should not auto-start — require user to press Play.
- Provide speed controls including "1x" (slow enough to follow).

## Responsive

- All text must be readable at 200% zoom.
- Touch targets must be minimum 44×44px on mobile.
- Panels must be scrollable when content overflows on small screens.
