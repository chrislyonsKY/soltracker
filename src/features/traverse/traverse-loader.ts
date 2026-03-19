/**
 * Hybrid data loader: live MMGIS for active rovers, static GeoJSON for retired rovers.
 * TODO(M1): Implement full loading, normalization, and caching
 */
import type { RoverName } from "../../types.ts";

/**
 * Load traverse waypoints for a given rover.
 * @param rover - Rover name
 * @returns GeoJSON FeatureCollection with waypoint data
 */
export async function loadTraverse(
  _rover: RoverName
): Promise<GeoJSON.FeatureCollection> {
  // TODO(M1): Fetch from MMGIS for active rovers (M20, MSL)
  // TODO(M1): Import static GeoJSON for Spirit, Opportunity
  // TODO(M1): Normalize properties to consistent schema
  return { type: "FeatureCollection", features: [] };
}
