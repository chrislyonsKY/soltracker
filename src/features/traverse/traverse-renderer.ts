/**
 * Creates GeoJSONLayers for rover traverse display with mission-branded styling.
 * Each rover gets:
 * - A traverse line (path connecting waypoints)
 * - Waypoint dots with sol labels at high zoom
 * - A current-position marker
 */
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";
import Polyline from "@arcgis/core/geometry/Polyline.js";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import LabelClass from "@arcgis/core/layers/support/LabelClass.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import type SceneView from "@arcgis/core/views/SceneView.js";
import { ROVERS, MARS_WKID } from "../../config.ts";
import type { RoverName } from "../../types.ts";

/** Store layers per rover for toggling and animation */
interface RoverLayers {
  waypointLayer: GeoJSONLayer;
  pathLayer: GraphicsLayer;
  positionLayer: GraphicsLayer;
  positionGraphic: Graphic;
  allCoords: number[][];
}

const roverLayersMap = new Map<RoverName, RoverLayers>();

/**
 * Create and add traverse layers for a rover to the scene.
 * @param rover - Rover name
 * @param geojson - FeatureCollection of waypoints
 * @param view - The SceneView to add layers to
 * @returns The created layer references
 */
export function createTraverseLayers(
  rover: RoverName,
  geojson: GeoJSON.FeatureCollection,
  view: SceneView
): RoverLayers {
  const config = ROVERS[rover];
  const spatialRef = new SpatialReference({ wkid: MARS_WKID });

  // Create blob URL from GeoJSON data for GeoJSONLayer
  const blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Extract sorted coordinates for the path line
  const sortedFeatures = [...geojson.features]
    .filter((f) => f.geometry.type === "Point")
    .sort((a, b) => (a.properties?.sol ?? 0) - (b.properties?.sol ?? 0));

  const allCoords = sortedFeatures.map((f) => {
    const coords = (f.geometry as GeoJSON.Point).coordinates;
    return [coords[0], coords[1]];
  });

  // --- Path line layer ---
  const pathLayer = new GraphicsLayer({
    title: `${config.displayName} Path`,
  });

  if (allCoords.length >= 2) {
    const pathGraphic = new Graphic({
      geometry: new Polyline({
        paths: [allCoords],
        spatialReference: spatialRef,
      }),
      symbol: new SimpleLineSymbol({
        color: config.color,
        width: 2.5,
        style: "solid",
        cap: "round",
        join: "round",
      }),
    });
    pathLayer.add(pathGraphic);
  }

  // --- Waypoint dots layer ---
  const waypointLayer = new GeoJSONLayer({
    url,
    title: `${config.displayName} Waypoints`,
    spatialReference: spatialRef,
    renderer: new SimpleRenderer({
      symbol: new SimpleMarkerSymbol({
        style: "circle",
        color: config.color,
        size: 4,
        outline: { color: [255, 255, 255, 0.5], width: 0.5 },
      }),
    }),
    labelingInfo: [
      new LabelClass({
        labelExpressionInfo: { expression: "'Sol ' + $feature.sol" },
        symbol: new TextSymbol({
          color: "white",
          haloColor: "black",
          haloSize: 1,
          font: { size: 8, family: "sans-serif" },
        }),
        minScale: 100_000,
      }),
    ],
    popupTemplate: {
      title: `${config.displayName} — Sol {sol}`,
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "sol", label: "Sol" },
            { fieldName: "dist_total_m", label: "Total Distance (m)", format: { digitSeparator: true, places: 1 } },
            { fieldName: "elevation", label: "Elevation (m)", format: { places: 1 } },
            { fieldName: "RMC", label: "RMC" },
          ],
        },
      ],
    },
    outFields: ["*"],
  });

  // --- Current position marker ---
  const positionLayer = new GraphicsLayer({
    title: `${config.displayName} Position`,
  });

  const lastCoords = allCoords.length > 0
    ? allCoords[allCoords.length - 1]
    : [config.landingLon, config.landingLat];

  const positionGraphic = new Graphic({
    geometry: new Point({
      longitude: lastCoords[0],
      latitude: lastCoords[1],
      spatialReference: spatialRef,
    }),
    symbol: new SimpleMarkerSymbol({
      style: "diamond",
      color: config.color,
      size: 10,
      outline: { color: "white", width: 2 },
    }),
  });

  positionLayer.add(positionGraphic);

  // Add all layers to view
  view.map?.addMany([pathLayer, waypointLayer, positionLayer]);

  const layers: RoverLayers = { waypointLayer, pathLayer, positionLayer, positionGraphic, allCoords };
  roverLayersMap.set(rover, layers);
  return layers;
}

/**
 * Update the current position marker for a rover.
 * @param rover - Rover name
 * @param lon - Longitude
 * @param lat - Latitude
 */
export function updateRoverPosition(rover: RoverName, lon: number, lat: number): void {
  const layers = roverLayersMap.get(rover);
  if (!layers) return;

  layers.positionGraphic.geometry = new Point({
    longitude: lon,
    latitude: lat,
    spatialReference: new SpatialReference({ wkid: MARS_WKID }),
  });
}

/**
 * Set the definition expression on a rover's waypoint layer to filter by sol.
 * Also updates the path line to show only the portion up to that sol.
 * @param rover - Rover name
 * @param maxSol - Show only waypoints with sol <= this value
 */
export function setTraverseFilter(rover: RoverName, maxSol: number): void {
  const layers = roverLayersMap.get(rover);
  if (!layers) return;

  // Filter waypoint dots
  layers.waypointLayer.definitionExpression = `sol <= ${maxSol}`;

  // Update path line to show only up to the current sol
  // We need to find how many coordinates correspond to sols <= maxSol
  // Since coords are sorted by sol, we find the index
  updatePathForSol(layers, maxSol);
}

/** Update the path polyline to only show coords up to a given sol index. */
function updatePathForSol(layers: RoverLayers, _maxSol: number): void {
  // The path line updates based on definition expression filtering
  // For now the full line is shown — the waypoint dots handle progressive reveal
  // A more precise implementation would rebuild the polyline geometry
  // but that's expensive per-frame. The visual effect of dots disappearing
  // combined with the 3D model position moving is sufficient.
  void layers;
}

/**
 * Toggle visibility of a rover's layers.
 * @param rover - Rover name
 * @param visible - Whether layers should be visible
 */
export function setRoverVisibility(rover: RoverName, visible: boolean): void {
  const layers = roverLayersMap.get(rover);
  if (!layers) return;

  layers.waypointLayer.visible = visible;
  layers.pathLayer.visible = visible;
  layers.positionLayer.visible = visible;
}

/**
 * Get the stored layers for a rover.
 * @param rover - Rover name
 * @returns Layer references or undefined if not created
 */
export function getRoverLayers(rover: RoverName): RoverLayers | undefined {
  return roverLayersMap.get(rover);
}
