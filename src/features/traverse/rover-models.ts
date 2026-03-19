/**
 * 3D rover model placement on the Mars globe.
 * Uses official NASA GLB models as the primary position markers.
 * Falls back to colored 3D cone symbols if GLB loading fails.
 *
 * The 3D model IS the rover position marker — it replaces the old
 * 2D diamond marker from traverse-renderer.ts.
 */
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D.js";
import ObjectSymbol3DLayer from "@arcgis/core/symbols/ObjectSymbol3DLayer.js";
import IconSymbol3DLayer from "@arcgis/core/symbols/IconSymbol3DLayer.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import type SceneView from "@arcgis/core/views/SceneView.js";
import { ROVERS, MARS_WKID } from "../../config.ts";
import type { RoverName } from "../../types.ts";

/**
 * NASA-hosted GLB model URLs for each rover.
 * Perseverance: ~11.7MB, Curiosity: ~11.9MB, MER (Spirit/Opportunity): ~11.9MB
 */
const ROVER_MODEL_URLS: Record<RoverName, string> = {
  perseverance: "https://mars.nasa.gov/system/resources/gltf_files/25042_Perseverance.glb",
  curiosity: "https://mars.nasa.gov/system/resources/gltf_files/24584_Curiosity_static.glb",
  opportunity: "https://mars.nasa.gov/system/resources/gltf_files/24883_MER_static.glb",
  spirit: "https://mars.nasa.gov/system/resources/gltf_files/24883_MER_static.glb",
};

/** Rover height in meters for model scaling */
const ROVER_HEIGHTS: Record<RoverName, number> = {
  perseverance: 2.2,
  curiosity: 2.1,
  opportunity: 1.5,
  spirit: 1.5,
};

interface RoverModelEntry {
  layer: GraphicsLayer;
  graphic: Graphic;
  usesFallback: boolean;
}

const modelEntries = new Map<RoverName, RoverModelEntry>();

/**
 * Create 3D rover model markers for all rovers.
 * Each rover gets a GraphicsLayer with either a GLB model or a fallback
 * 3D icon. These ARE the position markers — the old diamond markers
 * in traverse-renderer are hidden when models load.
 * @param view - The SceneView to add model layers to
 */
export function initRoverModels(view: SceneView): void {
  for (const roverName of Object.keys(ROVERS) as RoverName[]) {
    const config = ROVERS[roverName];

    const layer = new GraphicsLayer({
      title: `${config.displayName} 3D Model`,
      elevationInfo: { mode: "on-the-ground" },
    });

    // Try 3D GLB model first, with fallback
    const symbol = create3DModelSymbol(roverName);

    const graphic = new Graphic({
      geometry: new Point({
        longitude: config.landingLon,
        latitude: config.landingLat,
        spatialReference: new SpatialReference({ wkid: MARS_WKID }),
      }),
      symbol,
      attributes: { rover: roverName },
    });

    layer.add(graphic);
    view.map?.addMany([layer]);

    modelEntries.set(roverName, {
      layer,
      graphic,
      usesFallback: false,
    });
  }
}

/**
 * Create the PointSymbol3D with ObjectSymbol3DLayer for a GLB model.
 * @param rover - Rover name
 * @returns PointSymbol3D configured with the rover's GLB model
 */
function create3DModelSymbol(rover: RoverName): PointSymbol3D {
  const modelUrl = ROVER_MODEL_URLS[rover];
  const height = ROVER_HEIGHTS[rover];

  return new PointSymbol3D({
    symbolLayers: [
      new ObjectSymbol3DLayer({
        resource: { href: modelUrl },
        height: height,
        anchor: "bottom",
        heading: 0,
        tilt: 0,
        roll: 0,
      }),
    ],
  });
}

/**
 * Create a fallback 3D icon symbol (colored marker) when GLB fails.
 * @param rover - Rover name
 * @returns PointSymbol3D with a colored icon
 */
export function createFallbackSymbol(rover: RoverName): PointSymbol3D {
  const config = ROVERS[rover];
  return new PointSymbol3D({
    symbolLayers: [
      new IconSymbol3DLayer({
        resource: { primitive: "circle" },
        material: { color: config.color },
        size: 14,
        outline: { color: "white", size: 2 },
      }),
    ],
    verticalOffset: {
      screenLength: 40,
      maxWorldLength: 200,
      minWorldLength: 20,
    },
  });
}

/**
 * Switch a rover to the fallback symbol if GLB failed to load.
 * @param rover - Rover name
 */
export function switchToFallback(rover: RoverName): void {
  const entry = modelEntries.get(rover);
  if (!entry || entry.usesFallback) return;

  entry.graphic.symbol = createFallbackSymbol(rover);
  entry.usesFallback = true;
  console.warn(`${ROVERS[rover].displayName}: GLB model failed, using fallback marker`);
}

/**
 * Update the 3D rover model position.
 * @param rover - Rover name
 * @param lon - Areocentric longitude
 * @param lat - Areocentric latitude
 * @param heading - Rover heading in degrees (from yaw data)
 */
export function updateRoverModelPosition(
  rover: RoverName,
  lon: number,
  lat: number,
  heading?: number
): void {
  const entry = modelEntries.get(rover);
  if (!entry) return;

  // Clone and update geometry
  entry.graphic.geometry = new Point({
    longitude: lon,
    latitude: lat,
    spatialReference: new SpatialReference({ wkid: MARS_WKID }),
  });

  // Update heading from waypoint yaw data
  if (heading !== undefined && !entry.usesFallback) {
    const symbol = (entry.graphic.symbol as PointSymbol3D).clone();
    const objLayer = symbol.symbolLayers.getItemAt(0) as ObjectSymbol3DLayer;
    if (objLayer) {
      objLayer.heading = heading;
      entry.graphic.symbol = symbol;
    }
  }
}

/**
 * Toggle 3D model visibility for a rover.
 * @param rover - Rover name
 * @param visible - Whether the model should be visible
 */
export function setRoverModelVisibility(rover: RoverName, visible: boolean): void {
  const entry = modelEntries.get(rover);
  if (entry) {
    entry.layer.visible = visible;
  }
}

/**
 * Get the model entry for a rover.
 * @param rover - Rover name
 * @returns Model entry or undefined
 */
export function getRoverModelEntry(rover: RoverName): RoverModelEntry | undefined {
  return modelEntries.get(rover);
}
