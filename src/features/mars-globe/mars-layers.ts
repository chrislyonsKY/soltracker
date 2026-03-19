/**
 * Factory functions for Mars-specific ArcGIS layers.
 * Multi-resolution imagery: Viking MDIM (global, 232m) → CTX (global, 5m).
 */
import ElevationLayer from "@arcgis/core/layers/ElevationLayer.js";
import TileLayer from "@arcgis/core/layers/TileLayer.js";
import { MARS_DEM_URL, MARS_VIKING_URL, MARS_SHADED_RELIEF_URL } from "../../config.ts";

/** CTX mosaic from Murray Lab via Esri Astro — 5m/px global coverage */
const MARS_CTX_URL = "https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer";

/**
 * Create the Mars DEM elevation layer for ground/terrain.
 * @returns ElevationLayer configured for Mars MDEM200M (200m resolution)
 */
export function createMarsElevation(): ElevationLayer {
  return new ElevationLayer({
    url: MARS_DEM_URL,
    copyright: "NASA, ESA, HRSC, Goddard Space Flight Center, USGS, Esri",
  });
}

/**
 * Create the Viking MDIM 2.1 color imagery basemap layer.
 * Global coverage at 232m/px — visible at all zoom levels as base.
 * @returns TileLayer for Viking MDIM imagery
 */
export function createMarsImagery(): TileLayer {
  return new TileLayer({
    url: MARS_VIKING_URL,
    title: "Viking MDIM 2.1",
    copyright: "USGS Astrogeology Science Center, NASA, JPL, Esri",
  });
}

/**
 * Create the CTX high-resolution imagery layer.
 * Murray Lab preliminary CTX mosaic at ~5m/px, near-global coverage.
 * Overlays on top of Viking MDIM for detail when zoomed in.
 * @returns TileLayer for CTX imagery
 */
export function createMarsCTX(): TileLayer {
  return new TileLayer({
    url: MARS_CTX_URL,
    title: "CTX 5m Mosaic",
    copyright: "NASA/JPL/MSSS/The Murray Lab, Caltech",
    opacity: 0.85,
    minScale: 500_000, // Only show when zoomed in closer than ~500km
  });
}

/**
 * Create the HRSC/MOLA shaded relief basemap layer.
 * @returns TileLayer for shaded relief imagery
 */
export function createMarsShadedRelief(): TileLayer {
  return new TileLayer({
    url: MARS_SHADED_RELIEF_URL,
    title: "HRSC/MOLA Shaded Relief",
    copyright: "ESA, DLR, FU Berlin, NASA, JPL, USGS, Esri",
    visible: false,
  });
}
