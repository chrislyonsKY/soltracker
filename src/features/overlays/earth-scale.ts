/**
 * F17: Earth scale comparison.
 * Places simplified Earth region boundaries on the Mars surface
 * to understand planetary scale differences.
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

/** Simplified region boundaries as [lon, lat] ring arrays. */
interface EarthRegion {
  name: string;
  centroid: [number, number];
  /** Simplified boundary as [lon, lat][] */
  ring: number[][];
}

/**
 * Approximate regions for scale comparison.
 * Simplified to ~8-10 points per boundary.
 */
const REGIONS: Record<string, EarthRegion> = {
  kentucky: {
    name: "Kentucky",
    centroid: [-85.3, 37.8],
    ring: [
      [-89.5, 36.5], [-89.1, 36.5], [-88.0, 36.5], [-84.8, 36.5],
      [-83.7, 36.6], [-82.6, 37.8], [-82.0, 38.4], [-83.0, 38.7],
      [-84.8, 39.1], [-85.7, 38.7], [-87.1, 38.0], [-88.1, 37.5],
      [-89.2, 36.9], [-89.5, 36.5],
    ],
  },
  texas: {
    name: "Texas",
    centroid: [-99.9, 31.5],
    ring: [
      [-106.6, 31.8], [-103.0, 32.0], [-103.0, 36.5], [-100.0, 36.5],
      [-94.5, 33.6], [-93.5, 31.0], [-97.0, 26.0], [-99.0, 26.0],
      [-100.0, 28.0], [-103.0, 29.0], [-104.7, 29.6], [-106.5, 31.8],
      [-106.6, 31.8],
    ],
  },
  france: {
    name: "France",
    centroid: [2.2, 46.2],
    ring: [
      [-1.8, 43.4], [-1.2, 46.0], [-4.8, 48.4], [-1.6, 48.8],
      [1.7, 51.1], [2.5, 51.1], [8.2, 49.0], [7.5, 47.4],
      [6.8, 44.0], [3.1, 43.2], [0.5, 42.7], [-1.8, 43.4],
    ],
  },
  japan: {
    name: "Japan (Honshu)",
    centroid: [138.0, 36.0],
    ring: [
      [130.9, 33.9], [131.5, 34.5], [133.0, 34.3], [135.0, 34.7],
      [136.8, 35.1], [139.0, 35.0], [140.0, 35.7], [140.5, 38.3],
      [140.0, 40.5], [139.5, 41.5], [140.5, 41.8], [140.0, 39.5],
      [141.0, 38.3], [141.0, 36.5], [140.5, 35.3], [139.5, 34.5],
      [137.0, 34.3], [135.3, 33.5], [132.5, 33.3], [130.9, 33.9],
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

  // Offset the region's ring to center it at the target Mars coordinates
  const offsetLon = centerLon - region.centroid[0];
  const offsetLat = centerLat - region.centroid[1];

  const marsRing = region.ring.map(([lon, lat]) => [
    lon + offsetLon,
    lat + offsetLat,
  ]);

  const polygon = new Polygon({
    rings: [marsRing],
    spatialReference: new SpatialReference({ wkid: MARS_WKID }),
  });

  const fillGraphic = new Graphic({
    geometry: polygon,
    symbol: new SimpleFillSymbol({
      color: [255, 255, 255, 0.15],
      outline: { color: [255, 255, 255, 0.8], width: 2 },
    }),
  });

  const labelGraphic = new Graphic({
    geometry: new Point({
      longitude: centerLon,
      latitude: centerLat,
      spatialReference: new SpatialReference({ wkid: MARS_WKID }),
    }),
    symbol: new TextSymbol({
      text: region.name,
      color: "white",
      haloColor: "black",
      haloSize: 2,
      font: { size: 14, weight: "bold", family: "sans-serif" },
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
