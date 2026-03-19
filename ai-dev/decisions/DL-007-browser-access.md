# DL-007: Browser Tool Access During Development

**Date:** 2026-03-19
**Status:** Accepted
**Author:** Chris Lyons

## Context

Claude Code has optional browser access (Chrome) that can be enabled per project. For a project consuming multiple external APIs (NASA MMGIS, NASA Photos, REMS weather, Esri Astro tile services) and using the ArcGIS Maps SDK with planetary-specific behavior, browser access provides significant development quality advantages.

## Decision

Enable Chrome browser access in Claude Code for the full development lifecycle. Use it as a first-class development tool for API verification, documentation lookup, visual testing, and data exploration.

## Mandated Browser Usage

The following tasks **require** browser verification before implementation:

1. **Any new API integration** — hit the endpoint in browser, confirm response schema matches `ai-dev/field-schema.md`. If schema has drifted, update field-schema.md before writing code.
2. **Any ArcGIS class or component usage** — fetch the current API reference page to verify method signatures, property names, and deprecation status. The SDK moves fast; training data may be stale.
3. **Any UI feature completion** — open `localhost:5173` to visually verify rendering, layout, interaction, and console errors.
4. **Calcite component integration** — browse the Calcite component docs to confirm prop names, slot names, and event signatures.

## Alternatives Considered

- **CLI-only development** — Rejected. `curl` can verify API responses but can't render a 3D WebGL globe or inspect Calcite layout. Visual verification is essential for this project.
- **Browser for testing only** — Rejected. The documentation lookup and API schema verification use cases are equally valuable during implementation, not just QA.

## Consequences

- Higher confidence in API integration code — schemas verified at implementation time, not just at runtime.
- Fewer ArcGIS SDK bugs — method signatures confirmed against live docs, not training memory.
- Visual testing catches layout/rendering issues early in the dev loop.
- Slightly slower development cadence (browser round-trips), but dramatically fewer bugs.

## Key URLs for Browser Bookmarks

```
# API Endpoints (verify before coding)
https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json
https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json
https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=DEMO_KEY
https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json
https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer

# Documentation (fetch before writing ArcGIS code)
https://developers.arcgis.com/javascript/latest/api-reference/
https://developers.arcgis.com/javascript/latest/sample-code/mars/
https://developers.arcgis.com/calcite-design-system/components/

# Reference apps (compare behavior)
https://esri.github.io/explore-mars/
https://mars.nasa.gov/maps/location/?mission=M20

# Dev server (visual verification)
http://localhost:5173
```
