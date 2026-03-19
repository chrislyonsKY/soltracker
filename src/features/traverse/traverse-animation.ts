/**
 * Sol-by-sol traverse animation engine.
 * Controls playback, progressive path reveal, camera follow, and emits
 * sol-change events for dashboard/photos to subscribe to.
 */
import type { AnimationState, RoverName, SolChangeDetail } from "../../types.ts";
import { AnimationTimer } from "../../utils/animation-timer.ts";
import { solToEarthDate } from "../../utils/sol-date.ts";
import { ROVERS } from "../../config.ts";
import { setTraverseFilter, updateRoverPosition } from "./traverse-renderer.ts";
import { updateRoverModelPosition } from "./rover-models.ts";
import { flyTo } from "../mars-globe/mars-scene.ts";

/** Stored waypoint data for lookup during animation */
interface WaypointEntry {
  sol: number;
  lon: number;
  lat: number;
  elevation: number | null;
  distanceMeters: number;
  yaw: number | null;
}

const state: AnimationState = {
  activeRover: "perseverance",
  currentSol: 0,
  maxSol: 0,
  isPlaying: false,
  speed: 1,
  followCamera: true,
};

const timer = new AnimationTimer(1);
const waypointsByRover = new Map<RoverName, WaypointEntry[]>();

// Wire timer tick to sol advancement
timer.onTick(() => {
  if (!state.isPlaying) return;
  const next = state.currentSol + 1;
  if (next > state.maxSol) {
    pause();
    return;
  }
  applySol(next);
});

/**
 * Register waypoint data for a rover so the animation engine can look up positions.
 * @param rover - Rover name
 * @param features - GeoJSON features with sol, lon, lat, elevation, dist_total_m
 */
export function registerWaypoints(rover: RoverName, features: GeoJSON.Feature[]): void {
  const entries: WaypointEntry[] = features
    .filter((f) => f.geometry.type === "Point")
    .map((f) => {
      const props = f.properties ?? {};
      const coords = (f.geometry as GeoJSON.Point).coordinates;
      return {
        sol: props.sol ?? 0,
        lon: coords[0],
        lat: coords[1],
        elevation: coords[2] ?? props.elev_geoid ?? null,
        distanceMeters: props.dist_total_m ?? 0,
        yaw: props.yaw ?? null,
      };
    })
    .sort((a, b) => a.sol - b.sol);
  waypointsByRover.set(rover, entries);
}

/**
 * Get current animation state (readonly copy).
 * @returns Animation state snapshot
 */
export function getAnimationState(): Readonly<AnimationState> {
  return { ...state };
}

/**
 * Set the active rover for animation. Resets to max sol and updates range.
 * @param rover - Rover name
 */
export function setActiveRover(rover: RoverName): void {
  if (state.isPlaying) pause();
  state.activeRover = rover;

  const waypoints = waypointsByRover.get(rover);
  state.maxSol = waypoints?.length ? waypoints[waypoints.length - 1].sol : 0;
  state.currentSol = state.maxSol;

  // Always emit state change so dashboard updates, even with no waypoints
  emitStateChange();

  if (state.maxSol > 0) {
    applySol(state.currentSol);
  } else {
    // No waypoints — emit sol-change with landing coordinates
    const config = ROVERS[rover];
    const detail: SolChangeDetail = {
      rover,
      sol: 0,
      lon: config.landingLon,
      lat: config.landingLat,
      elevation: null,
      distanceMeters: 0,
      earthDate: solToEarthDate(rover, 0),
    };
    document.dispatchEvent(new CustomEvent("sol-change", { detail }));
  }
}

/** Start playback. */
export function play(): void {
  if (state.maxSol === 0) return;
  if (state.currentSol >= state.maxSol) {
    state.currentSol = 0;
    applySol(0);
  }
  state.isPlaying = true;
  timer.setTickRate(state.speed);
  timer.start();
  emitStateChange();
}

/** Pause playback. */
export function pause(): void {
  state.isPlaying = false;
  timer.stop();
  emitStateChange();
}

/** Toggle play/pause. */
export function togglePlayPause(): void {
  if (state.isPlaying) pause();
  else play();
}

/**
 * Seek to a specific sol.
 * @param sol - Target sol number
 */
export function seekTo(sol: number): void {
  const clamped = Math.max(0, Math.min(sol, state.maxSol));
  applySol(clamped);
}

/** Step forward to the next waypoint sol. */
export function stepForward(): void {
  const waypoints = waypointsByRover.get(state.activeRover);
  if (!waypoints) return;
  const next = waypoints.find((w) => w.sol > state.currentSol);
  if (next) applySol(next.sol);
}

/** Step back to the previous waypoint sol. */
export function stepBack(): void {
  const waypoints = waypointsByRover.get(state.activeRover);
  if (!waypoints) return;
  for (let i = waypoints.length - 1; i >= 0; i--) {
    if (waypoints[i].sol < state.currentSol) {
      applySol(waypoints[i].sol);
      return;
    }
  }
  applySol(0);
}

/**
 * Set playback speed.
 * @param speed - Sols per second (1, 5, 10, or 50)
 */
export function setSpeed(speed: 1 | 5 | 10 | 50): void {
  state.speed = speed;
  if (state.isPlaying) {
    timer.setTickRate(speed);
  }
  emitStateChange();
}

/** Toggle camera follow mode. */
export function toggleFollowCamera(): void {
  state.followCamera = !state.followCamera;
}

/**
 * Get the max sol for a rover.
 * @param rover - Rover name
 * @returns Max sol number
 */
export function getRoverMaxSol(rover: RoverName): number {
  const waypoints = waypointsByRover.get(rover);
  return waypoints?.length ? waypoints[waypoints.length - 1].sol : 0;
}

// --- Internal ---

/** Apply a sol value: update filter, position, emit event, optionally move camera. */
function applySol(sol: number): void {
  state.currentSol = sol;

  // Update layer filter for progressive reveal
  setTraverseFilter(state.activeRover, sol);

  // Find the waypoint at or just before this sol
  const waypoint = findWaypointAtSol(state.activeRover, sol);
  if (waypoint) {
    updateRoverPosition(state.activeRover, waypoint.lon, waypoint.lat);
    updateRoverModelPosition(
      state.activeRover,
      waypoint.lon,
      waypoint.lat,
      waypoint.yaw ?? undefined
    );

    // Camera follow (don't await — fire and forget to avoid blocking animation)
    if (state.followCamera && state.isPlaying) {
      flyTo(waypoint.lat, waypoint.lon, 50_000).catch(() => {
        // Interrupted — fine
      });
    }

    // Emit sol-change event for dashboard, photos, etc.
    const detail: SolChangeDetail = {
      rover: state.activeRover,
      sol,
      lon: waypoint.lon,
      lat: waypoint.lat,
      elevation: waypoint.elevation,
      distanceMeters: waypoint.distanceMeters,
      earthDate: solToEarthDate(state.activeRover, sol),
    };
    document.dispatchEvent(new CustomEvent("sol-change", { detail }));
  }
}

/** Find the closest waypoint at or before the given sol (binary search). */
function findWaypointAtSol(rover: RoverName, sol: number): WaypointEntry | null {
  const waypoints = waypointsByRover.get(rover);
  if (!waypoints?.length) return null;

  let low = 0;
  let high = waypoints.length - 1;
  let result: WaypointEntry | null = null;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (waypoints[mid].sol <= sol) {
      result = waypoints[mid];
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

/** Emit a generic animation-state-change event for UI updates. */
function emitStateChange(): void {
  document.dispatchEvent(new CustomEvent("animation-state-change", {
    detail: { ...state },
  }));
}
