/**
 * F7: Cinematic fly-through mode.
 * Automated camera animation that follows the rover's traverse path
 * like a drone flyover with terrain-aware tilted camera.
 */
import Camera from "@arcgis/core/Camera.js";
import Point from "@arcgis/core/geometry/Point.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import { getSceneView } from "../mars-globe/mars-scene.ts";
import { MARS_WKID } from "../../config.ts";
import type { RoverName } from "../../types.ts";

interface FlyWaypoint {
  sol: number;
  lon: number;
  lat: number;
}

type CinematicSpeed = "slow" | "medium" | "fast";

const SPEED_DURATIONS: Record<CinematicSpeed, number> = {
  slow: 4000,
  medium: 2000,
  fast: 800,
};

let isRunning = false;
let shouldStop = false;
let currentSpeed: CinematicSpeed = "medium";

/**
 * Start cinematic fly-through along a rover's traverse.
 * @param rover - Rover name
 * @param waypoints - Ordered waypoints to fly through
 * @param speed - Flight speed preset
 * @param startIndex - Index to start from (default 0)
 */
export async function startCinematicFlythrough(
  _rover: RoverName,
  waypoints: FlyWaypoint[],
  speed: CinematicSpeed = "medium",
  startIndex: number = 0
): Promise<void> {
  const view = getSceneView();
  if (!view || waypoints.length < 2 || isRunning) return;

  isRunning = true;
  shouldStop = false;
  currentSpeed = speed;

  const spatialRef = new SpatialReference({ wkid: MARS_WKID });
  const duration = SPEED_DURATIONS[currentSpeed];

  // Sample every Nth waypoint to avoid too many goTo calls
  const step = Math.max(1, Math.floor(waypoints.length / 200));
  const sampled = waypoints.filter((_, i) => i % step === 0 || i === waypoints.length - 1);

  for (let i = Math.max(0, startIndex); i < sampled.length - 1; i++) {
    if (shouldStop) break;

    const current = sampled[i];
    const next = sampled[i + 1];

    // Calculate heading from current to next waypoint
    const heading = calculateBearing(current.lat, current.lon, next.lat, next.lon);

    const camera = new Camera({
      position: new Point({
        longitude: current.lon,
        latitude: current.lat,
        z: 2000, // 2km above surface
        spatialReference: spatialRef,
      }),
      heading,
      tilt: 65, // looking forward and down
    });

    try {
      await view.goTo(camera, {
        duration,
        easing: "ease-in-out",
      });
    } catch {
      // Interrupted by user — that's fine
      break;
    }
  }

  isRunning = false;
  shouldStop = false;

  // Emit event so UI can update
  document.dispatchEvent(new CustomEvent("cinematic-end"));
}

/** Stop the cinematic fly-through. */
export function stopCinematicFlythrough(): void {
  shouldStop = true;
}

/** Check if cinematic mode is active. */
export function isCinematicRunning(): boolean {
  return isRunning;
}

/** Set the cinematic speed. */
export function setCinematicSpeed(speed: CinematicSpeed): void {
  currentSpeed = speed;
}

/**
 * Calculate bearing between two lat/lon points.
 * @returns Heading in degrees (0 = north, 90 = east)
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLon = (lon2 - lon1) * toRad;
  const y = Math.sin(dLon) * Math.cos(lat2 * toRad);
  const x =
    Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
    Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
