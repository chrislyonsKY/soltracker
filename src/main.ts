/**
 * SolTracker — App bootstrap.
 *
 * Initializes Calcite components, the Mars SceneView, and orchestrates
 * all feature modules.
 */
import "@esri/calcite-components/main.css";
import { setAssetPath } from "@esri/calcite-components";
import { defineCustomElements } from "@esri/calcite-components/dist/loader";
import "./styles/main.css";
import "./styles/components.css";

import { initMarsScene, flyTo } from "./features/mars-globe/mars-scene.ts";
import { loadAllTraverses, getMaxSol } from "./features/traverse/traverse-loader.ts";
import { createTraverseLayers, setRoverVisibility } from "./features/traverse/traverse-renderer.ts";
import {
  registerWaypoints, setActiveRover, togglePlayPause,
  stepForward, stepBack, seekTo, setSpeed, toggleFollowCamera,
  getAnimationState, getRoverMaxSol,
} from "./features/traverse/traverse-animation.ts";
import { initDashboard } from "./features/dashboard/dashboard-panel.ts";
import { initWeatherWidget } from "./features/dashboard/weather-widget.ts";
import { initPhotoGallery } from "./features/photos/photo-gallery.ts";
import { initCameraFilter } from "./features/photos/camera-filter.ts";
import { initRoverModels, setRoverModelVisibility } from "./features/traverse/rover-models.ts";
import { initElevationProfile, buildElevationProfile } from "./features/elevation/elevation-profile.ts";
import { initMarsClock } from "./features/dashboard/mars-clock.ts";
import { startCinematicFlythrough, stopCinematicFlythrough, isCinematicRunning } from "./features/traverse/cinematic-flythrough.ts";
import { initUrlState } from "./features/url-state.ts";
import { initIngenuity, setIngenuityVisibility } from "./features/traverse/ingenuity.ts";
import { ROVERS, ROVER_NAMES, getNasaApiKey, setNasaApiKey } from "./config.ts";
import type { RoverName, AnimationState } from "./types.ts";

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
        registerWaypoints(rover, data.features);
        const maxSol = getMaxSol(data);
        console.info(`${ROVERS[rover].displayName}: ${data.features.length} waypoints, max sol ${maxSol}`);
      }
    }

    // Set initial active rover
    setActiveRover("perseverance");

    // Step 4: Wire animation controls (F3)
    initAnimationControls();

    // Step 5: Wire rover toggle
    initRoverToggle();

    // Step 6: Initialize dashboard (F4)
    initDashboard();

    // Step 7: Initialize weather widget (F4)
    initWeatherWidget();

    // Step 8: Initialize photo gallery (F5)
    initPhotoGallery();
    initCameraFilter();

    // Step 9: Initialize 3D rover models (F13)
    initRoverModels(view);

    // Step 10: Initialize elevation profile (F6)
    await initElevationProfile();
    // Build profile for Perseverance (default rover)
    const persTraverse = traverses.get("perseverance");
    if (persTraverse) {
      buildElevationProfile("perseverance", persTraverse.features);
    }

    // Step 11: Initialize Mars dual clock (F9)
    initMarsClock();

    // Step 12: Initialize URL deep-linking (F12)
    initUrlState();

    // Step 13: Wire cinematic fly-through button (F7)
    initCinematicButton(traverses);

    // Step 14: Initialize Ingenuity helicopter tracking (F15)
    initIngenuity(view);
    initIngenuityToggle();

    // Step 15: Wire settings dialog
    initSettingsDialog();

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
 * Wire the action bar rover buttons to toggle visibility and switch active rover.
 */
function initRoverToggle(): void {
  const actions = document.querySelectorAll<HTMLElement>("calcite-action[data-rover]");
  for (const action of actions) {
    const rover = action.dataset.rover as RoverName;
    if (!rover) continue;

    const config = ROVERS[rover];
    action.style.setProperty("--calcite-color-brand", config.color);

    action.addEventListener("click", () => {
      const current = roverVisibility.get(rover) ?? true;

      // If clicking the already-active rover, toggle its visibility
      const animState = getAnimationState();
      if (animState.activeRover === rover) {
        const next = !current;
        roverVisibility.set(rover, next);
        setRoverVisibility(rover, next);
        setRoverModelVisibility(rover, next);
        if (next) {
          action.removeAttribute("appearance");
        } else {
          action.setAttribute("appearance", "transparent");
        }
      } else {
        // Switch active rover
        setActiveRover(rover);
        updateSliderRange();
        updateSolDisplay(getAnimationState());

        // Fly to rover's landing site
        flyTo(config.landingLat, config.landingLon, 500_000).catch(() => {});

        // Update active indicator on all actions
        for (const a of actions) {
          if (a.dataset.rover === rover) {
            a.setAttribute("active", "");
          } else {
            a.removeAttribute("active");
          }
        }
      }
    });
  }
}

/**
 * Wire play/pause, step, speed, slider, and follow controls.
 */
function initAnimationControls(): void {
  const btnPlay = document.getElementById("btn-play");
  const btnStepBack = document.getElementById("btn-step-back");
  const btnStepForward = document.getElementById("btn-step-forward");
  const btnFollow = document.getElementById("btn-follow");
  const speedSelect = document.getElementById("speed-select") as HTMLSelectElement | null;
  const slider = document.getElementById("sol-slider") as HTMLInputElement | null;

  btnPlay?.addEventListener("click", () => {
    togglePlayPause();
  });

  btnStepBack?.addEventListener("click", () => {
    stepBack();
    updateSolDisplay(getAnimationState());
  });

  btnStepForward?.addEventListener("click", () => {
    stepForward();
    updateSolDisplay(getAnimationState());
  });

  btnFollow?.addEventListener("click", () => {
    toggleFollowCamera();
    const state = getAnimationState();
    if (state.followCamera) {
      btnFollow.setAttribute("active", "");
    } else {
      btnFollow.removeAttribute("active");
    }
  });

  speedSelect?.addEventListener("calciteSelectChange", () => {
    const val = Number(speedSelect.value) as 1 | 5 | 10 | 50;
    setSpeed(val);
  });

  // Slider input — seek on drag
  slider?.addEventListener("calciteSliderInput", () => {
    const val = Number(slider.value);
    seekTo(val);
    updateSolDisplay(getAnimationState());
  });

  // Listen for animation state changes to update UI
  document.addEventListener("animation-state-change", ((e: CustomEvent<AnimationState>) => {
    const state = e.detail;
    updatePlayButton(state.isPlaying);
    updateSolDisplay(state);
  }) as EventListener);

  // Listen for sol-change to update slider position
  document.addEventListener("sol-change", ((e: CustomEvent) => {
    const { sol } = e.detail;
    if (slider) {
      slider.value = String(sol);
    }
    updateSolDisplay(getAnimationState());
  }) as EventListener);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Don't capture when typing in inputs
    if ((e.target as HTMLElement)?.tagName === "CALCITE-INPUT") return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        togglePlayPause();
        break;
      case "ArrowRight":
        stepForward();
        updateSolDisplay(getAnimationState());
        break;
      case "ArrowLeft":
        stepBack();
        updateSolDisplay(getAnimationState());
        break;
    }
  });

  updateSliderRange();
}

/** Update the slider min/max for the active rover. */
function updateSliderRange(): void {
  const slider = document.getElementById("sol-slider");
  if (!slider) return;

  const state = getAnimationState();
  const maxSol = getRoverMaxSol(state.activeRover);

  slider.setAttribute("min", "0");
  slider.setAttribute("max", String(maxSol));
  slider.setAttribute("value", String(state.currentSol));
}

/** Update play/pause button icon. */
function updatePlayButton(isPlaying: boolean): void {
  const btn = document.getElementById("btn-play");
  if (btn) {
    btn.setAttribute("icon-start", isPlaying ? "pause" : "play");
    btn.setAttribute("aria-label", isPlaying ? "Pause animation" : "Play animation");
  }
}

/** Update the sol display text. */
function updateSolDisplay(state: AnimationState): void {
  const el = document.getElementById("sol-display");
  if (el) {
    const maxSol = getRoverMaxSol(state.activeRover);
    el.textContent = `Sol ${state.currentSol.toLocaleString()} / ${maxSol.toLocaleString()}`;
  }
}

/** Wire Ingenuity toggle button. */
function initIngenuityToggle(): void {
  const btn = document.getElementById("btn-ingenuity");
  if (!btn) return;

  let visible = true;
  btn.addEventListener("click", () => {
    visible = !visible;
    setIngenuityVisibility(visible);
    if (visible) {
      btn.removeAttribute("appearance");
    } else {
      btn.setAttribute("appearance", "transparent");
    }
  });
}

/** Wire cinematic fly-through button. */
function initCinematicButton(traverses: Map<RoverName, GeoJSON.FeatureCollection>): void {
  const btn = document.getElementById("btn-cinematic");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (isCinematicRunning()) {
      stopCinematicFlythrough();
      btn.removeAttribute("active");
      return;
    }

    const animState = getAnimationState();
    const data = traverses.get(animState.activeRover);
    if (!data) return;

    const waypoints = data.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => {
        const coords = (f.geometry as GeoJSON.Point).coordinates;
        return { sol: f.properties?.sol ?? 0, lon: coords[0], lat: coords[1] };
      })
      .sort((a, b) => a.sol - b.sol);

    btn.setAttribute("active", "");
    startCinematicFlythrough(animState.activeRover, waypoints).then(() => {
      btn.removeAttribute("active");
    });
  });

  document.addEventListener("cinematic-end", () => {
    btn.removeAttribute("active");
  });
}

/** Wire settings dialog for BYOK API key. */
function initSettingsDialog(): void {
  const dialog = document.getElementById("settings-dialog") as HTMLElement | null;
  const btnSettings = document.getElementById("btn-settings");
  const btnSave = document.getElementById("btn-save-key");
  const btnClose = document.getElementById("btn-close-settings");
  const input = document.getElementById("api-key-input") as HTMLInputElement | null;

  btnSettings?.addEventListener("click", () => {
    if (dialog) {
      dialog.setAttribute("open", "");
      if (input) {
        const key = getNasaApiKey();
        input.value = key === "DEMO_KEY" ? "" : key;
      }
    }
  });

  btnSave?.addEventListener("click", () => {
    if (input) {
      setNasaApiKey(input.value.trim());
    }
    dialog?.removeAttribute("open");
  });

  btnClose?.addEventListener("click", () => {
    dialog?.removeAttribute("open");
  });
}

bootstrap();
