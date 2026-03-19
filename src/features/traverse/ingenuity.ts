/**
 * F15: Ingenuity helicopter tracking.
 * Loads flight path and waypoint data from MMGIS and displays as
 * 3D arcs above the terrain.
 */
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import LabelClass from "@arcgis/core/layers/support/LabelClass.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import type SceneView from "@arcgis/core/views/SceneView.js";
import { MMGIS_BASE, MARS_WKID } from "../../config.ts";

const INGENUITY_COLOR = "#9B59B6"; // Purple

let flightPathLayer: GeoJSONLayer | null = null;
let waypointLayer: GeoJSONLayer | null = null;

/**
 * Initialize Ingenuity helicopter layers on the scene.
 * @param view - The SceneView to add layers to
 */
export async function initIngenuity(view: SceneView): Promise<void> {
  try {
    // Fetch flight path
    const flightUrl = `${MMGIS_BASE}/M20/Layers/json/m20_heli_flight_path.json`;
    const waypointUrl = `${MMGIS_BASE}/M20/Layers/json/m20_heli_waypoints.json`;

    flightPathLayer = new GeoJSONLayer({
      url: flightUrl,
      title: "Ingenuity Flight Paths",
      spatialReference: new SpatialReference({ wkid: MARS_WKID }),
      renderer: new SimpleRenderer({
        symbol: new SimpleLineSymbol({
          color: INGENUITY_COLOR,
          width: 2,
          style: "dash",
        }),
      }),
      elevationInfo: {
        mode: "relative-to-ground",
        offset: 500, // Display flights above terrain for visibility
      },
    });

    waypointLayer = new GeoJSONLayer({
      url: waypointUrl,
      title: "Ingenuity Waypoints",
      spatialReference: new SpatialReference({ wkid: MARS_WKID }),
      renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          style: "triangle",
          color: INGENUITY_COLOR,
          size: 6,
          outline: { color: "white", width: 0.5 },
        }),
      }),
      labelingInfo: [
        new LabelClass({
          labelExpressionInfo: { expression: "'Flight ' + $feature.sol" },
          symbol: new TextSymbol({
            color: INGENUITY_COLOR,
            haloColor: "black",
            haloSize: 1,
            font: { size: 8, family: "sans-serif" },
          }),
          minScale: 100_000,
        }),
      ],
      popupTemplate: {
        title: "Ingenuity — Flight {sol}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "sol", label: "Sol" },
              { fieldName: "dist_total_m", label: "Total Distance (m)" },
            ],
          },
        ],
      },
      outFields: ["*"],
    });

    view.map?.addMany([flightPathLayer, waypointLayer]);
    console.info("Ingenuity helicopter layers loaded");
  } catch (err) {
    console.warn("Failed to load Ingenuity data:", err);
  }
}

/**
 * Toggle Ingenuity layer visibility.
 * @param visible - Whether layers should be visible
 */
export function setIngenuityVisibility(visible: boolean): void {
  if (flightPathLayer) flightPathLayer.visible = visible;
  if (waypointLayer) waypointLayer.visible = visible;
}
