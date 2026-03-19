/**
 * Creates GeoJSONLayers for rover traverse display with mission-branded styling.
 * Each rover gets a waypoint layer (points) and a current-position marker (GraphicsLayer).
 */
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import LabelClass from "@arcgis/core/layers/support/LabelClass.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import type SceneView from "@arcgis/core/views/SceneView.js";
import { ROVERS, MARS_WKID } from "../../config.ts";
import type { RoverName } from "../../types.ts";

/** Store layers per rover for toggling and animation */
interface RoverLayers {
  waypointLayer: GeoJSONLayer;
  positionLayer: GraphicsLayer;
  positionGraphic: Graphic;
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

  // Create blob URL from GeoJSON data for GeoJSONLayer
  const blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Waypoint layer with rover-colored dots
  const waypointLayer = new GeoJSONLayer({
    url,
    title: `${config.displayName} Traverse`,
    spatialReference: new SpatialReference({ wkid: MARS_WKID }),
    renderer: new SimpleRenderer({
      symbol: new SimpleMarkerSymbol({
        style: "circle",
        color: config.color,
        size: 5,
        outline: {
          color: [255, 255, 255, 0.6],
          width: 0.5,
        },
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

  // Current position marker layer
  const positionLayer = new GraphicsLayer({
    title: `${config.displayName} Position`,
  });

  // Find the last waypoint for initial position
  const lastFeature = geojson.features[geojson.features.length - 1];
  const lastCoords = lastFeature?.geometry.type === "Point"
    ? (lastFeature.geometry as GeoJSON.Point).coordinates
    : [config.landingLon, config.landingLat];

  const positionGraphic = new Graphic({
    geometry: new Point({
      longitude: lastCoords[0],
      latitude: lastCoords[1],
      spatialReference: new SpatialReference({ wkid: MARS_WKID }),
    }),
    symbol: new SimpleMarkerSymbol({
      style: "diamond",
      color: config.color,
      size: 12,
      outline: {
        color: "white",
        width: 2,
      },
    }),
  });

  positionLayer.add(positionGraphic);

  // Add layers to the view
  view.map?.addMany([waypointLayer, positionLayer]);

  const layers: RoverLayers = { waypointLayer, positionLayer, positionGraphic };
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
 * Used for animation progressive reveal.
 * @param rover - Rover name
 * @param maxSol - Show only waypoints with sol <= this value
 */
export function setTraverseFilter(rover: RoverName, maxSol: number): void {
  const layers = roverLayersMap.get(rover);
  if (!layers) return;

  layers.waypointLayer.definitionExpression = `sol <= ${maxSol}`;
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
