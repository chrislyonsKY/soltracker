/**
 * SolTracker — App bootstrap.
 *
 * Initializes Calcite components, the Mars SceneView, and orchestrates
 * feature module startup in sequence.
 */
import "@esri/calcite-components/main.css";
import { setAssetPath } from "@esri/calcite-components";
import { defineCustomElements } from "@esri/calcite-components/dist/loader";
import "./styles/main.css";
import "./styles/components.css";

import { initMarsScene } from "./features/mars-globe/mars-scene.ts";
import { loadAllTraverses, getMaxSol } from "./features/traverse/traverse-loader.ts";
import { createTraverseLayers, setRoverVisibility } from "./features/traverse/traverse-renderer.ts";
import { ROVERS, ROVER_NAMES } from "./config.ts";
import type { RoverName } from "./types.ts";

// Set Calcite asset path for icons/i18n loaded at runtime
setAssetPath("https://cdn.jsdelivr.net/npm/@esri/calcite-components@5/dist/calcite/assets");

async function bootstrap(): Promise<void> {
  const loadingEl = document.getElementById("loading-indicator");

  try {
    // Step 1: Register Calcite custom elements
    defineCustomElements(window);

    // Step 2: Initialize Mars globe (F1)
    const view = await initMarsScene();
    console.info("Mars SceneView ready:", view.spatialReference.wkid);

    // Hide loading indicator
    loadingEl?.classList.add("hidden");

    // Step 3: Load and display traverse data (F2)
    const traverses = await loadAllTraverses();
    for (const [rover, data] of traverses) {
      if (data.features.length > 0) {
        createTraverseLayers(rover, data, view);
        const maxSol = getMaxSol(data);
        console.info(`${ROVERS[rover].displayName}: ${data.features.length} waypoints, max sol ${maxSol}`);
      }
    }

    // Step 3b: Wire rover toggle action bar
    initRoverToggle();

    // Step 4: Initialize animation engine (F3)
    // TODO(M2): initAnimationControls();

    // Step 5: Initialize dashboard (F4)
    // TODO(M3): initDashboard();

    // Step 6: Initialize photo gallery (F5)
    // TODO(M3): initPhotoGallery();

    // Step 7: Initialize elevation profile (F6)
    // TODO(M4): initElevationProfile();

  } catch (err) {
    console.error("SolTracker initialization failed:", err);
    if (loadingEl) {
      loadingEl.textContent = "Failed to load Mars scene. Check console for details.";
    }
  }
}

/** Track which rovers are visible */
const roverVisibility = new Map<RoverName, boolean>(
  ROVER_NAMES.map((r) => [r, true])
);

/**
 * Wire the action bar rover buttons to toggle layer visibility.
 */
function initRoverToggle(): void {
  const actions = document.querySelectorAll<HTMLElement>("calcite-action[data-rover]");
  for (const action of actions) {
    const rover = action.dataset.rover as RoverName;
    if (!rover) continue;

    // Set rover color indicator
    const config = ROVERS[rover];
    action.setAttribute("icon", "pin");
    action.style.setProperty("--calcite-color-brand", config.color);

    action.addEventListener("click", () => {
      const current = roverVisibility.get(rover) ?? true;
      const next = !current;
      roverVisibility.set(rover, next);
      setRoverVisibility(rover, next);

      // Visual feedback: toggle active state
      if (next) {
        action.removeAttribute("appearance");
      } else {
        action.setAttribute("appearance", "transparent");
      }
    });
  }
}

bootstrap();
