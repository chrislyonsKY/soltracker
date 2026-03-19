/**
 * 3D rover model placement on the Mars globe.
 * Uses official NASA GLB models placed at each rover's current position
 * via ArcGIS PointSymbol3D + ObjectSymbol3DLayer.
 */
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D.js";
import ObjectSymbol3DLayer from "@arcgis/core/symbols/ObjectSymbol3DLayer.js";
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

/** Approximate rover dimensions in meters for scaling */
const ROVER_SIZES: Record<RoverName, { height: number; heading: number }> = {
  perseverance: { height: 2.2, heading: 0 },
  curiosity: { height: 2.1, heading: 0 },
  opportunity: { height: 1.5, heading: 0 },
  spirit: { height: 1.5, heading: 0 },
};

interface RoverModelEntry {
  layer: GraphicsLayer;
  graphic: Graphic;
  loaded: boolean;
}

const modelEntries = new Map<RoverName, RoverModelEntry>();

/**
 * Create and add 3D rover model layers for all rovers.
 * Models are loaded lazily — only fetched when first displayed.
 * @param view - The SceneView to add model layers to
 */
export function initRoverModels(view: SceneView): void {
  for (const roverName of Object.keys(ROVERS) as RoverName[]) {
    const config = ROVERS[roverName];
    const modelUrl = ROVER_MODEL_URLS[roverName];
    const size = ROVER_SIZES[roverName];

    const layer = new GraphicsLayer({
      title: `${config.displayName} 3D Model`,
      elevationInfo: {
        mode: "on-the-ground",
      },
    });

    const symbol = new PointSymbol3D({
      symbolLayers: [
        new ObjectSymbol3DLayer({
          resource: { href: modelUrl },
          height: size.height,
          heading: size.heading,
          anchor: "bottom",
        }),
      ],
    });

    const graphic = new Graphic({
      geometry: new Point({
        longitude: config.landingLon,
        latitude: config.landingLat,
        spatialReference: new SpatialReference({ wkid: MARS_WKID }),
      }),
      symbol,
    });

    layer.add(graphic);
    view.map?.addMany([layer]);

    modelEntries.set(roverName, {
      layer,
      graphic,
      loaded: true,
    });
  }
}

/**
 * Update the 3D rover model position.
 * @param rover - Rover name
 * @param lon - Areocentric longitude
 * @param lat - Areocentric latitude
 * @param heading - Rover heading in degrees (optional, from yaw data)
 */
export function updateRoverModelPosition(
  rover: RoverName,
  lon: number,
  lat: number,
  heading?: number
): void {
  const entry = modelEntries.get(rover);
  if (!entry) return;

  entry.graphic.geometry = new Point({
    longitude: lon,
    latitude: lat,
    spatialReference: new SpatialReference({ wkid: MARS_WKID }),
  });

  // Update heading if provided (from waypoint yaw data)
  if (heading !== undefined) {
    const symbol = entry.graphic.symbol as PointSymbol3D;
    const objLayer = symbol.symbolLayers.getItemAt(0) as ObjectSymbol3DLayer;
    if (objLayer) {
      objLayer.heading = heading;
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
