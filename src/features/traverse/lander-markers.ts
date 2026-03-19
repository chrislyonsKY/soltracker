/**
 * Static lander markers — places pin markers for non-rover missions
 * (InSight, Phoenix, Viking 1&2, Beagle 2, Mars 3).
 */
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import type SceneView from "@arcgis/core/views/SceneView.js";
import { ROVERS, LANDERS, MARS_WKID } from "../../config.ts";

let landerLayer: GraphicsLayer | null = null;

/**
 * Create markers for all lander missions on the globe.
 * @param view - SceneView to add markers to
 */
export function initLanderMarkers(view: SceneView): void {
  landerLayer = new GraphicsLayer({
    title: "Mars Landers",
  });

  const spatialRef = new SpatialReference({ wkid: MARS_WKID });

  for (const name of LANDERS) {
    const config = ROVERS[name];

    // Pin marker
    const marker = new Graphic({
      geometry: new Point({
        longitude: config.landingLon,
        latitude: config.landingLat,
        spatialReference: spatialRef,
      }),
      symbol: new SimpleMarkerSymbol({
        style: "square",
        color: config.color,
        size: 8,
        outline: { color: "white", width: 1.5 },
      }),
      popupTemplate: {
        title: `${config.displayName} (${config.agency})`,
        content: `
          <b>Location:</b> ${config.location}<br/>
          <b>Landing Date:</b> ${config.landingDate}<br/>
          <b>Agency:</b> ${config.agency}<br/>
          <b>Duration:</b> ${config.maxSol ? config.maxSol + " sols" : "Brief contact"}<br/>
          <b>Coordinates:</b> ${config.landingLat.toFixed(2)}°N, ${config.landingLon.toFixed(2)}°E
        `,
      },
    });

    // Label
    const label = new Graphic({
      geometry: new Point({
        longitude: config.landingLon,
        latitude: config.landingLat,
        spatialReference: spatialRef,
      }),
      symbol: new TextSymbol({
        text: config.displayName,
        color: config.color,
        haloColor: [0, 0, 0, 0.8],
        haloSize: 1.5,
        font: { size: 9, family: "Helvetica Neue, sans-serif", weight: "bold" },
        yoffset: 12,
      }),
    });

    landerLayer.addMany([marker, label]);
  }

  view.map?.add(landerLayer);
  console.info(`Lander markers added: ${LANDERS.length} missions`);
}

/**
 * Toggle lander marker visibility.
 * @param visible - Whether markers should be visible
 */
export function setLanderVisibility(visible: boolean): void {
  if (landerLayer) landerLayer.visible = visible;
}
