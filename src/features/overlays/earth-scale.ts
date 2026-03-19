/**
 * F17: Earth scale comparison.
 * Places accurate Earth region boundaries on the Mars surface.
 *
 * Mars radius (3,396 km) is ~53.3% of Earth's (6,371 km).
 * A degree of latitude on Earth = 111.32 km, on Mars = 59.27 km.
 * So 1° Earth lat covers 1.878x more of Mars's globe.
 * We scale Earth coordinates by this factor to show true relative size.
 */
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import Point from "@arcgis/core/geometry/Point.js";
import type SceneView from "@arcgis/core/views/SceneView.js";
import { MARS_WKID } from "../../config.ts";

/** Earth-to-Mars scale factor: Earth regions appear this much larger on Mars */
const EARTH_MARS_SCALE = 6_371 / 3_396; // ~1.876

interface EarthRegion {
  name: string;
  centroid: [number, number]; // [lon, lat]
  ring: number[][]; // [lon, lat][] — accurate boundary
}

/**
 * Geographically accurate region boundaries.
 * Higher point count for recognizable shapes.
 */
const REGIONS: Record<string, EarthRegion> = {
  kentucky: {
    name: "Kentucky",
    centroid: [-85.76, 37.84],
    ring: [
      // Western tip along Mississippi
      [-89.57, 36.50], [-89.10, 36.50], [-88.05, 36.50],
      // Southern border (Tennessee line)
      [-87.85, 36.63], [-86.56, 36.63], [-85.98, 36.63],
      [-84.86, 36.60], [-83.69, 36.60], [-82.87, 36.59],
      // Southeast — Cumberland Gap area
      [-82.60, 36.92], [-82.03, 37.56],
      // Eastern border — Big Sandy River / Tug Fork
      [-82.35, 37.73], [-82.50, 37.93], [-82.64, 38.14],
      [-82.59, 38.40], [-82.17, 38.60],
      // Northeast — Ohio River border
      [-82.89, 38.75], [-83.64, 38.64], [-84.23, 38.84],
      [-84.81, 39.10], [-85.17, 38.69],
      // North — Ohio River continues
      [-85.44, 38.73], [-85.66, 38.34], [-86.03, 38.05],
      [-86.26, 38.05], [-86.52, 37.92],
      // Northwest — Ohio River to Mississippi
      [-87.07, 37.80], [-87.50, 37.93], [-87.68, 37.82],
      [-87.87, 37.92], [-88.03, 37.80], [-88.07, 37.51],
      [-88.42, 37.15], [-88.51, 37.07],
      // Back to western tip
      [-88.47, 36.96], [-89.10, 36.95], [-89.38, 36.62],
      [-89.57, 36.50],
    ],
  },
  texas: {
    name: "Texas",
    centroid: [-99.25, 31.25],
    ring: [
      // Northwest panhandle
      [-103.04, 36.50], [-100.00, 36.50],
      // North border east
      [-100.00, 34.56], [-99.47, 34.37], [-96.82, 33.85],
      // Northeast — Red River
      [-95.15, 33.94], [-94.48, 33.64],
      // East border — Sabine River
      [-94.04, 33.55], [-93.82, 32.16], [-93.84, 31.10],
      [-93.53, 30.41],
      // Gulf Coast
      [-93.76, 29.76], [-94.62, 29.47], [-95.14, 29.03],
      [-96.15, 28.30], [-96.65, 28.08], [-97.15, 27.83],
      [-97.15, 26.96], [-97.38, 26.00], [-97.80, 25.84],
      // Rio Grande — southern border
      [-98.33, 26.08], [-99.11, 26.42], [-99.44, 27.02],
      [-100.11, 28.11], [-100.53, 28.66],
      [-101.01, 29.37], [-101.40, 29.77],
      [-102.30, 29.88], [-103.15, 29.02], [-103.33, 29.02],
      // West — New Mexico border
      [-104.05, 29.32], [-104.53, 29.64], [-104.69, 30.12],
      [-106.38, 31.73], [-106.63, 31.87],
      // West border — straight line up
      [-106.63, 32.00], [-103.04, 32.00],
      [-103.04, 36.50],
    ],
  },
  france: {
    name: "France",
    centroid: [2.45, 46.60],
    ring: [
      // Southwest — Spanish border / Atlantic
      [-1.79, 43.36], [-1.26, 43.00], [0.63, 42.70],
      // Pyrenees — Mediterranean
      [1.73, 42.50], [2.83, 42.33], [3.17, 42.43],
      // Mediterranean coast
      [3.29, 43.21], [3.96, 43.52], [4.37, 43.39],
      [5.05, 43.30], [6.12, 43.08], [6.79, 43.37],
      // Southeast — Italian/Swiss border
      [7.37, 43.73], [7.07, 44.13], [6.63, 44.85],
      [7.05, 45.43], [6.80, 46.13], [6.99, 46.46],
      // East — German/Belgian border
      [6.19, 46.97], [5.97, 47.68], [7.59, 48.06],
      [7.62, 48.99], [8.23, 48.97],
      // Northeast
      [7.07, 49.12], [6.74, 49.16], [6.36, 49.46],
      [5.82, 49.55], [4.87, 49.79], [4.14, 49.98],
      // North — English Channel
      [2.56, 51.07], [1.67, 50.95], [1.59, 50.76],
      // Channel coast west
      [1.01, 49.95], [-0.14, 49.68], [-1.26, 49.68],
      [-1.59, 48.63],
      // Brittany
      [-2.69, 48.46], [-3.57, 48.72], [-4.55, 48.38],
      [-4.77, 48.02], [-3.59, 47.80], [-2.80, 47.63],
      // Atlantic coast
      [-2.44, 47.27], [-2.01, 46.82], [-1.18, 46.32],
      [-1.23, 45.99], [-1.07, 45.54], [-1.15, 44.66],
      [-1.25, 44.40], [-1.79, 43.36],
    ],
  },
  japan: {
    name: "Japan",
    centroid: [137.0, 37.0],
    ring: [
      // Kyushu — southwest
      [130.18, 33.25], [130.64, 33.10], [131.01, 33.28],
      [131.33, 33.92], [131.97, 34.06],
      // Shikoku / Inland Sea transition
      [132.78, 34.28], [133.53, 34.33],
      // Southern Honshu — Kii Peninsula
      [135.10, 34.68], [135.47, 33.90], [136.05, 34.10],
      [136.81, 35.04],
      // Central Honshu — Pacific side
      [137.69, 34.73], [138.22, 34.60], [139.11, 35.12],
      [139.73, 35.40],
      // Tokyo Bay / Kanto
      [139.87, 35.67], [140.05, 35.95],
      // Northeast Honshu — Pacific coast
      [140.49, 36.40], [140.82, 37.06], [140.98, 37.93],
      [141.04, 38.45], [140.92, 39.46],
      [140.52, 40.22], [140.07, 40.54],
      // Tsugaru Strait (top of Honshu)
      [139.72, 41.05], [140.26, 41.42],
      // Hokkaido — south coast
      [140.28, 42.00], [140.50, 42.56],
      [141.24, 42.96], [142.09, 42.38],
      // Hokkaido — east
      [143.24, 42.00], [144.38, 43.29], [145.54, 43.33],
      // Hokkaido — north
      [145.13, 44.25], [144.18, 44.84], [142.63, 45.40],
      // Hokkaido — Sea of Japan side
      [141.73, 45.27], [141.20, 44.43], [140.34, 43.33],
      [140.14, 42.56], [139.95, 42.02],
      // Sea of Japan coast — Honshu west
      [139.50, 40.59], [139.82, 39.80],
      [139.34, 38.80], [139.61, 38.20],
      [139.22, 37.50], [138.48, 37.08],
      [137.24, 36.76], [136.79, 36.29],
      [136.11, 35.95], [135.16, 35.58],
      // Western tip
      [134.24, 35.62], [133.39, 35.53],
      [132.65, 35.42], [131.85, 35.07],
      // Back to Kyushu via Kanmon Strait
      [131.05, 34.43], [130.87, 33.97],
      [130.18, 33.25],
    ],
  },
};

let scaleLayer: GraphicsLayer | null = null;

/**
 * Initialize the Earth scale comparison feature.
 * @param view - SceneView to add the comparison layer to
 */
export function initEarthScale(view: SceneView): void {
  scaleLayer = new GraphicsLayer({
    title: "Earth Scale Comparison",
    visible: false,
  });
  view.map?.add(scaleLayer);
}

/**
 * Place an Earth region on the Mars surface centered at given coordinates.
 * Scales the region by the Earth/Mars radius ratio so it shows true
 * relative size on the Mars globe.
 * @param regionId - Region identifier from REGIONS
 * @param centerLon - Mars longitude to center the region at
 * @param centerLat - Mars latitude to center the region at
 */
export function placeEarthRegion(
  regionId: string,
  centerLon: number,
  centerLat: number
): void {
  if (!scaleLayer) return;

  const region = REGIONS[regionId];
  if (!region) return;

  scaleLayer.removeAll();

  // Scale and offset the region's boundary
  const marsRing = region.ring.map(([lon, lat]) => {
    // Offset from centroid, scale by Earth/Mars ratio, then place at target
    const dLon = (lon - region.centroid[0]) * EARTH_MARS_SCALE;
    const dLat = (lat - region.centroid[1]) * EARTH_MARS_SCALE;
    return [centerLon + dLon, centerLat + dLat];
  });

  const polygon = new Polygon({
    rings: [marsRing],
    spatialReference: new SpatialReference({ wkid: MARS_WKID }),
  });

  const fillGraphic = new Graphic({
    geometry: polygon,
    symbol: new SimpleFillSymbol({
      color: [255, 255, 255, 0.12],
      outline: {
        color: [2, 191, 231, 0.7],
        width: 2,
        style: "dash",
      },
    }),
  });

  const labelGraphic = new Graphic({
    geometry: new Point({
      longitude: centerLon,
      latitude: centerLat,
      spatialReference: new SpatialReference({ wkid: MARS_WKID }),
    }),
    symbol: new TextSymbol({
      text: `${region.name}\n(Earth scale on Mars)`,
      color: [2, 191, 231, 0.9],
      haloColor: [0, 0, 0, 0.8],
      haloSize: 2,
      font: { size: 12, weight: "bold", family: "Helvetica Neue, sans-serif" },
      horizontalAlignment: "center",
    }),
  });

  scaleLayer.addMany([fillGraphic, labelGraphic]);
  scaleLayer.visible = true;
}

/** Remove the scale comparison overlay. */
export function clearEarthScale(): void {
  if (scaleLayer) {
    scaleLayer.removeAll();
    scaleLayer.visible = false;
  }
}

/** Get available region names. */
export function getAvailableRegions(): Array<{ id: string; name: string }> {
  return Object.entries(REGIONS).map(([id, r]) => ({ id, name: r.name }));
}
