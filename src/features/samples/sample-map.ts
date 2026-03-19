/**
 * F8: Sample Collection Map (Perseverance).
 * Displays sample tube locations including the Three Forks depot.
 */
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import LabelClass from "@arcgis/core/layers/support/LabelClass.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import type SceneView from "@arcgis/core/views/SceneView.js";
import { MMGIS_BASE, MARS_WKID } from "../../config.ts";

const SAMPLE_COLORS: Record<string, string> = {
  "rock_core": "#E74C3C",
  "regolith": "#D4A843",
  "atmosphere": "#3498DB",
  "witness": "#95A5A6",
  "default": "#FFFFFF",
};

let sampleLayer: GeoJSONLayer | null = null;

/**
 * Initialize the sample collection map layer.
 * Tries to load sample data from MMGIS, falls back to embedded data.
 * @param view - SceneView to add layers to
 */
export async function initSampleMap(view: SceneView): Promise<void> {
  try {
    // Try MMGIS for sample data (may exist as a layer)
    const sampleUrl = `${MMGIS_BASE}/M20/Layers/json/M20_sample_tubes.json`;

    sampleLayer = new GeoJSONLayer({
      url: sampleUrl,
      title: "Perseverance Sample Tubes",
      spatialReference: new SpatialReference({ wkid: MARS_WKID }),
      renderer: new UniqueValueRenderer({
        field: "type",
        defaultSymbol: new SimpleMarkerSymbol({
          style: "square",
          color: SAMPLE_COLORS.default,
          size: 8,
          outline: { color: "white", width: 1 },
        }),
        uniqueValueInfos: Object.entries(SAMPLE_COLORS).map(([value, color]) => ({
          value,
          symbol: new SimpleMarkerSymbol({
            style: "square",
            color,
            size: 8,
            outline: { color: "white", width: 1 },
          }),
        })),
      }),
      labelingInfo: [
        new LabelClass({
          labelExpressionInfo: { expression: "$feature.name" },
          symbol: new TextSymbol({
            color: "white",
            haloColor: "black",
            haloSize: 1,
            font: { size: 7, family: "sans-serif" },
          }),
          minScale: 50_000,
        }),
      ],
      popupTemplate: {
        title: "Sample: {name}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "name", label: "Sample Name" },
              { fieldName: "type", label: "Type" },
              { fieldName: "sol_collected", label: "Sol Collected" },
              { fieldName: "sol_deposited", label: "Sol Deposited" },
            ],
          },
        ],
      },
      outFields: ["*"],
      visible: true,
    });

    view.map?.add(sampleLayer);
    console.info("Sample tube layer loaded");
  } catch (err) {
    // MMGIS may not have a sample-specific layer — log and skip
    console.warn("Sample tube layer not available from MMGIS:", err);
    await loadFallbackSamples(view);
  }
}

/** Load fallback sample data from embedded JSON. */
async function loadFallbackSamples(view: SceneView): Promise<void> {
  // Three Forks depot samples — approximate positions from published maps
  const depotSamples = {
    type: "FeatureCollection" as const,
    features: [
      makeSample("Montagnac", "rock_core", 77.0528, 18.4775, 313, 653),
      makeSample("Salette", "rock_core", 77.0525, 18.4773, 289, 651),
      makeSample("Coulettes", "rock_core", 77.0522, 18.4771, 257, 649),
      makeSample("Roubion", "rock_core", 77.0519, 18.4769, 372, 647),
      makeSample("Melyn", "regolith", 77.0516, 18.4767, 370, 645),
      makeSample("Crosswind Lake", "rock_core", 77.0513, 18.4765, 230, 643),
      makeSample("Bearwallow Mountain", "rock_core", 77.0510, 18.4763, 226, 641),
      makeSample("Atsah", "rock_core", 77.0507, 18.4761, 390, 639),
      makeSample("Skyland", "rock_core", 77.0504, 18.4759, 194, 637),
      makeSample("Atmo Mountain", "atmosphere", 77.0501, 18.4757, 370, 635),
    ],
  };

  const blob = new Blob([JSON.stringify(depotSamples)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  sampleLayer = new GeoJSONLayer({
    url,
    title: "Three Forks Depot (Perseverance)",
    spatialReference: new SpatialReference({ wkid: MARS_WKID }),
    renderer: new UniqueValueRenderer({
      field: "type",
      defaultSymbol: new SimpleMarkerSymbol({
        style: "square", color: "#fff", size: 8,
        outline: { color: "white", width: 1 },
      }),
      uniqueValueInfos: Object.entries(SAMPLE_COLORS).map(([value, color]) => ({
        value,
        symbol: new SimpleMarkerSymbol({
          style: "square", color, size: 8,
          outline: { color: "white", width: 1 },
        }),
      })),
    }),
    popupTemplate: {
      title: "Sample: {name}",
      content: "Type: {type} | Collected Sol {sol_collected} | Deposited Sol {sol_deposited}",
    },
    outFields: ["*"],
  });

  view.map?.add(sampleLayer);
}

/** Toggle sample layer visibility. */
export function setSampleVisibility(visible: boolean): void {
  if (sampleLayer) sampleLayer.visible = visible;
}

/** Helper to create a sample GeoJSON feature. */
function makeSample(
  name: string, type: string, lon: number, lat: number,
  solCollected: number, solDeposited: number
): GeoJSON.Feature {
  return {
    type: "Feature",
    properties: { name, type, sol_collected: solCollected, sol_deposited: solDeposited },
    geometry: { type: "Point", coordinates: [lon, lat] },
  };
}
