/**
 * SolTracker — App bootstrap.
 *
 * Initializes Calcite components, the Mars SceneView, and orchestrates
 * feature module startup in sequence.
 */
import "@esri/calcite-components/dist/cdn/main.css";
import { setAssetPath } from "@esri/calcite-components";
import { defineCustomElements } from "@esri/calcite-components/dist/loader";
import "./styles/main.css";
import "./styles/components.css";

import { initMarsScene } from "./features/mars-globe/mars-scene.ts";

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

    // Step 3: Load traverse data (F2)
    // TODO(M1): await initTraverseDisplay(view);

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

bootstrap();
