/**
 * Creates GeoJSONLayers for rover traverse display with mission-branded styling.
 * TODO(M1): Implement layer creation, waypoint rendering, current position marker
 */
import type { RoverName } from "../../types.ts";

/**
 * Create and add traverse layers for a rover to the scene.
 * @param rover - Rover name
 */
export async function createTraverseLayers(
  _rover: RoverName
): Promise<void> {
  // TODO(M1): Create GeoJSONLayer with rover-colored renderer
  // TODO(M1): Add waypoint markers with sol labels at high zoom
  // TODO(M1): Add current position marker via GraphicsLayer
}
