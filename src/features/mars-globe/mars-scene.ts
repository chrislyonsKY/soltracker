/**
 * Mars SceneView initialization using <arcgis-scene> web component.
 * Sets up the Mars globe with WKID 104971, elevation, and imagery layers.
 */
import "@arcgis/map-components/components/arcgis-scene";
import type { ArcgisScene } from "@arcgis/map-components/components/arcgis-scene";
import Map from "@arcgis/core/Map.js";
import Camera from "@arcgis/core/Camera.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import Point from "@arcgis/core/geometry/Point.js";
import type SceneView from "@arcgis/core/views/SceneView.js";
import { MARS_WKID, ROVERS } from "../../config.ts";
import { createMarsElevation, createMarsImagery, createMarsCTX, createMarsShadedRelief } from "./mars-layers.ts";

let sceneEl: ArcgisScene | null = null;
let viewInstance: SceneView | null = null;

/**
 * Initialize the Mars SceneView by configuring the <arcgis-scene> element.
 * @returns The SceneView instance once ready
 */
export async function initMarsScene(): Promise<SceneView> {
  const el = document.querySelector<ArcgisScene & HTMLElement>("arcgis-scene");
  if (!el) {
    throw new Error("Missing <arcgis-scene> element in DOM");
  }

  const marsElevation = createMarsElevation();
  const marsImagery = createMarsImagery();
  const marsCTX = createMarsCTX();
  const marsShadedRelief = createMarsShadedRelief();

  const map = new Map({
    ground: { layers: [marsElevation] },
    layers: [marsImagery, marsCTX, marsShadedRelief],
  });

  el.map = map;
  el.spatialReference = new SpatialReference({ wkid: MARS_WKID });

  // Wait for the view to be ready
  await el.viewOnReady();
  const view = el.view;

  sceneEl = el;
  viewInstance = view;

  // Disable problematic Mars lighting
  view.environment.lighting.directShadowsEnabled = false;

  // Fly to Jezero Crater (Perseverance landing site) on initial load
  const jezero = ROVERS.perseverance;
  await flyTo(jezero.landingLat, jezero.landingLon, 800_000);

  return view;
}

/**
 * Fly the camera to a specific Mars location.
 * @param lat - Areocentric latitude
 * @param lon - Areocentric longitude
 * @param zMeters - Camera altitude in meters above surface
 */
export async function flyTo(lat: number, lon: number, zMeters: number): Promise<void> {
  if (!sceneEl) {
    console.warn("flyTo called before scene initialized");
    return;
  }

  try {
    const camera = new Camera({
      position: new Point({
        latitude: lat,
        longitude: lon,
        z: zMeters,
        spatialReference: new SpatialReference({ wkid: MARS_WKID }),
      }),
      heading: 0,
      tilt: 0,
    });

    await sceneEl.goTo(camera, { duration: 2000 });
  } catch (err) {
    // goTo can throw if interrupted by user interaction — that's fine
    console.warn("Camera animation interrupted:", err);
  }
}

/**
 * Get the current SceneView instance.
 * @returns The SceneView or null if not yet initialized
 */
export function getSceneView(): SceneView | null {
  return viewInstance;
}
