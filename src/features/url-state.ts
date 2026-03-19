/**
 * F12: URL deep-linking and shareability.
 * Serializes app state to URL hash for sharing specific views.
 */
import { getSceneView } from "./mars-globe/mars-scene.ts";
import { getAnimationState, setActiveRover, seekTo } from "./traverse/traverse-animation.ts";
import { flyTo } from "./mars-globe/mars-scene.ts";
import type { RoverName } from "../types.ts";

const VALID_ROVERS: RoverName[] = ["perseverance", "curiosity", "opportunity", "spirit"];

interface UrlState {
  rover?: RoverName;
  sol?: number;
  lon?: number;
  lat?: number;
  zoom?: number;
  tilt?: number;
  heading?: number;
}

/**
 * Initialize URL state management.
 * Reads initial state from URL hash and sets up state serialization.
 */
export function initUrlState(): void {
  // Read initial state from URL
  const initial = parseHash();
  if (initial.rover || initial.sol !== undefined) {
    applyUrlState(initial);
  }

  // Update URL on meaningful state changes (debounced)
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  document.addEventListener("sol-change", () => {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(serializeToHash, 1000);
  });

  // Wire share button if present
  const shareBtn = document.getElementById("btn-share");
  shareBtn?.addEventListener("click", () => {
    serializeToHash();
    navigator.clipboard.writeText(window.location.href).then(() => {
      // Brief visual feedback
      shareBtn.setAttribute("icon-start", "check");
      setTimeout(() => shareBtn.setAttribute("icon-start", "share"), 2000);
    }).catch(() => {
      // Clipboard failed — at least the URL is updated
    });
  });
}

/** Parse the URL hash into state parameters. */
function parseHash(): UrlState {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return {};

  const state: UrlState = {};

  // Parse path-style segments: rover/perseverance/sol/1805
  const pathMatch = hash.match(/rover\/(\w+)/);
  if (pathMatch && VALID_ROVERS.includes(pathMatch[1] as RoverName)) {
    state.rover = pathMatch[1] as RoverName;
  }

  const solMatch = hash.match(/sol\/(\d+)/);
  if (solMatch) state.sol = parseInt(solMatch[1], 10);

  // Parse key=value segments separated by / or &
  // Handles: lon=98.3421/lat=12.0884 or lon=98.3421&lat=12.0884
  const kvPairs = hash.match(/(\w+)=([-\d.]+)/g) ?? [];
  const params = new Map<string, string>();
  for (const pair of kvPairs) {
    const [key, val] = pair.split("=");
    params.set(key, val);
  }

  if (params.has("lon")) state.lon = parseFloat(params.get("lon")!);
  if (params.has("lat")) state.lat = parseFloat(params.get("lat")!);
  if (params.has("zoom")) state.zoom = parseFloat(params.get("zoom")!);
  if (params.has("tilt")) state.tilt = parseFloat(params.get("tilt")!);
  if (params.has("heading")) state.heading = parseFloat(params.get("heading")!);

  return state;
}

/** Apply URL state to the app. */
function applyUrlState(state: UrlState): void {
  if (state.rover) {
    setActiveRover(state.rover);
  }

  if (state.sol !== undefined) {
    seekTo(state.sol);
  }

  if (state.lon !== undefined && state.lat !== undefined) {
    const z = state.zoom ?? 500_000;
    flyTo(state.lat, state.lon, z).catch(() => {});
  }
}

/** Serialize current app state to URL hash. */
function serializeToHash(): void {
  const animState = getAnimationState();
  const view = getSceneView();

  const parts: string[] = [
    `rover/${animState.activeRover}`,
    `sol/${animState.currentSol}`,
  ];

  if (view?.camera?.position) {
    const pos = view.camera.position;
    const lon = pos.longitude;
    const lat = pos.latitude;
    if (lon != null && lat != null) {
      parts.push(`lon=${lon.toFixed(4)}`);
      parts.push(`lat=${lat.toFixed(4)}`);
      parts.push(`zoom=${Math.round(pos.z ?? 0)}`);
      parts.push(`tilt=${Math.round(view.camera.tilt)}`);
      parts.push(`heading=${Math.round(view.camera.heading)}`);
    }
  }

  window.location.hash = `/${parts.join("/")}`;
}
