/**
 * Basemap toggle — switch between Viking color, CTX grayscale, and shaded relief.
 */
import type SceneView from "@arcgis/core/views/SceneView.js";
import type TileLayer from "@arcgis/core/layers/TileLayer.js";

type BasemapMode = "viking" | "ctx" | "relief";

let currentMode: BasemapMode = "viking";
let vikingLayer: TileLayer | null = null;
let ctxLayer: TileLayer | null = null;
let reliefLayer: TileLayer | null = null;

/**
 * Initialize basemap toggle by finding layers in the map.
 * @param view - SceneView with layers already added
 */
export function initBasemapToggle(view: SceneView): void {
  const layers = view.map?.allLayers;
  if (!layers) return;

  vikingLayer = layers.find((l) => l.title === "Viking MDIM 2.1") as TileLayer | null;
  ctxLayer = layers.find((l) => l.title === "CTX 5m Mosaic") as TileLayer | null;
  reliefLayer = layers.find((l) => l.title === "HRSC/MOLA Shaded Relief") as TileLayer | null;

  // Build toggle UI
  const container = document.getElementById("basemap-toggle");
  if (!container) return;

  const modes: Array<{ id: BasemapMode; label: string }> = [
    { id: "viking", label: "Color" },
    { id: "ctx", label: "CTX 5m" },
    { id: "relief", label: "Relief" },
  ];

  for (const mode of modes) {
    const btn = document.createElement("button");
    btn.className = `basemap-btn ${mode.id === currentMode ? "active" : ""}`;
    btn.textContent = mode.label;
    btn.title = `Switch to ${mode.label} basemap`;
    btn.setAttribute("aria-label", `${mode.label} basemap`);
    btn.addEventListener("click", () => {
      setBasemap(mode.id);
      container.querySelectorAll(".basemap-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    container.appendChild(btn);
  }
}

/** Switch the active basemap. */
function setBasemap(mode: BasemapMode): void {
  currentMode = mode;

  if (vikingLayer) vikingLayer.visible = mode === "viking" || mode === "ctx";
  if (ctxLayer) ctxLayer.visible = mode === "ctx";
  if (reliefLayer) reliefLayer.visible = mode === "relief";
}
