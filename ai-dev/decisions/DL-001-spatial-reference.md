# DL-001: Spatial Reference — Mars_2000_Sphere (WKID 104971)

**Date:** 2026-03-19
**Status:** Accepted
**Author:** Chris Lyons

## Context

ArcGIS supports two Mars coordinate systems: GCS_Mars_2000 (ESRI:104905, ellipsoidal) and Mars_2000_Sphere (ESRI:104971, spherical). Both are supported in SceneView. We need to pick one for the project.

## Decision

Use **WKID 104971** (Mars_2000_Sphere) as the SceneView spatial reference.

## Alternatives Considered

- **ESRI:104905 (ellipsoidal)** — More geodetically accurate (accounts for Mars flattening at 1:169.89). Rejected because the official Esri Mars sample uses 104971, Esri Astro services are optimized for it, and the accuracy difference is imperceptible at rover-scale visualization.

## Consequences

- All GeoJSON data using areocentric lat/lon will work directly (MMGIS data is already compatible).
- The spherical model simplifies distance calculations.
- If a future feature requires precise geodetic measurements, we may need to revisit. Unlikely for a visualization app.

## References

- Esri Mars sample: `developers.arcgis.com/javascript/latest/sample-code/mars/`
- ESRI:104971 definition: `epsg.io/104971`
