/**
 * F14: Geological map overlay.
 * Adds Mars geological/mineralogical map layers from Mars Trek WMTS.
 */
import TileLayer from "@arcgis/core/layers/TileLayer.js";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer.js";
import type SceneView from "@arcgis/core/views/SceneView.js";

interface OverlayConfig {
  title: string;
  url: string;
  type: "tile" | "webtile";
  opacity: number;
}

const OVERLAYS: Record<string, OverlayConfig> = {
  "thermal-inertia": {
    title: "TES Thermal Inertia",
    url: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_TES_ThermalInertia_mosaic_global_7410m/1.0.0/default/default028mm/{z}/{y}/{x}.png",
    type: "webtile",
    opacity: 0.5,
  },
  "mola-colorshade": {
    title: "MOLA Colorized Hillshade",
    url: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
    type: "webtile",
    opacity: 0.5,
  },
  "themis-day": {
    title: "THEMIS IR Day",
    url: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12_clon0_ly/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
    type: "webtile",
    opacity: 0.5,
  },
};

const activeLayers = new Map<string, WebTileLayer | TileLayer>();

/**
 * Initialize geological overlay controls.
 * Creates toggle buttons for each available overlay.
 * @param view - SceneView to add overlays to
 */
export function initGeologicalOverlays(view: SceneView): void {
  const container = document.getElementById("overlay-controls");
  if (!container) return;

  for (const [id, config] of Object.entries(OVERLAYS)) {
    const btn = document.createElement("calcite-button");
    btn.setAttribute("appearance", "outline");
    btn.setAttribute("kind", "neutral");
    btn.setAttribute("scale", "s");
    btn.setAttribute("width", "full");
    btn.textContent = config.title;
    btn.dataset.overlayId = id;

    btn.addEventListener("click", () => {
      toggleOverlay(id, config, view);
      if (activeLayers.has(id)) {
        btn.setAttribute("appearance", "solid");
      } else {
        btn.setAttribute("appearance", "outline");
      }
    });

    container.appendChild(btn);
  }
}

/** Toggle an overlay layer on/off. */
function toggleOverlay(
  id: string,
  config: OverlayConfig,
  view: SceneView
): void {
  const existing = activeLayers.get(id);
  if (existing) {
    view.map?.remove(existing);
    activeLayers.delete(id);
    return;
  }

  const layer = new WebTileLayer({
    urlTemplate: config.url,
    title: config.title,
    opacity: config.opacity,
    copyright: "NASA/JPL/USGS",
  });

  view.map?.add(layer);
  activeLayers.set(id, layer);
}

/**
 * Set opacity of an active overlay.
 * @param id - Overlay identifier
 * @param opacity - Opacity value (0-1)
 */
export function setOverlayOpacity(id: string, opacity: number): void {
  const layer = activeLayers.get(id);
  if (layer) layer.opacity = opacity;
}
