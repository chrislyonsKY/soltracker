/**
 * Factory functions for Mars-specific ArcGIS layers.
 */
import ElevationLayer from "@arcgis/core/layers/ElevationLayer.js";
import TileLayer from "@arcgis/core/layers/TileLayer.js";
import { MARS_DEM_URL, MARS_VIKING_URL, MARS_SHADED_RELIEF_URL } from "../../config.ts";

/**
 * Create the Mars DEM elevation layer for ground/terrain.
 * @returns ElevationLayer configured for Mars MDEM200M
 */
export function createMarsElevation(): ElevationLayer {
  return new ElevationLayer({
    url: MARS_DEM_URL,
    copyright: "NASA, ESA, HRSC, Goddard Space Flight Center, USGS, Esri",
  });
}

/**
 * Create the Viking MDIM 2.1 color imagery basemap layer.
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
