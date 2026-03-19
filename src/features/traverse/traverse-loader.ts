/**
 * Hybrid data loader: live MMGIS for active rovers, static GeoJSON for retired rovers.
 * Normalizes all sources to a consistent waypoint schema.
 */
import { ROVERS } from "../../config.ts";
import { fetchMMGIS } from "../../services/mmgis-client.ts";
import type { RoverName } from "../../types.ts";

// Static GeoJSON imports for retired rovers
import spiritData from "../../data/spirit-traverse.geojson?url";
import opportunityData from "../../data/opportunity-traverse.geojson?url";

const staticUrls: Record<string, string> = {
  spirit: spiritData,
  opportunity: opportunityData,
};

/** In-memory cache keyed by rover name */
const cache = new Map<RoverName, GeoJSON.FeatureCollection>();

/**
 * Load traverse waypoints for a given rover.
 * Active rovers fetch from MMGIS; retired rovers load static GeoJSON.
 * @param rover - Rover name
 * @returns GeoJSON FeatureCollection with normalized waypoint properties
 */
export async function loadTraverse(
  rover: RoverName
): Promise<GeoJSON.FeatureCollection> {
  const cached = cache.get(rover);
  if (cached) return cached;

  const config = ROVERS[rover];
  let data: GeoJSON.FeatureCollection;

  if (config.dataSource === "mmgis" && config.mmgisMission) {
    data = await fetchMMGIS(config.mmgisMission, "waypoints");
  } else {
    data = await loadStaticGeoJSON(rover);
  }

  // Normalize properties across all sources
  data = normalizeFeatures(data, rover);

  // Filter out features with invalid coordinates
  data.features = data.features.filter((f) => {
    if (f.geometry.type !== "Point") return false;
    const coords = (f.geometry as GeoJSON.Point).coordinates;
    return (
      coords.length >= 2 &&
      coords[0] >= -180 && coords[0] <= 180 &&
      coords[1] >= -90 && coords[1] <= 90
    );
  });

  cache.set(rover, data);
  return data;
}

/**
 * Load all four rover traverses.
 * @returns Map of rover name to FeatureCollection
 */
export async function loadAllTraverses(): Promise<Map<RoverName, GeoJSON.FeatureCollection>> {
  const results = new Map<RoverName, GeoJSON.FeatureCollection>();
  const roverNames: RoverName[] = ["perseverance", "curiosity", "opportunity", "spirit"];

  const settled = await Promise.allSettled(
    roverNames.map(async (name) => {
      const data = await loadTraverse(name);
      return { name, data };
    })
  );

  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.set(result.value.name, result.value.data);
    } else {
      console.warn("Failed to load traverse:", result.reason);
    }
  }

  return results;
}

/**
 * Get the maximum sol number from a FeatureCollection.
 * @param fc - FeatureCollection with sol properties
 * @returns Maximum sol number, or 0 if empty
 */
export function getMaxSol(fc: GeoJSON.FeatureCollection): number {
  let max = 0;
  for (const f of fc.features) {
    const sol = f.properties?.sol;
    if (typeof sol === "number" && sol > max) max = sol;
  }
  return max;
}

/**
 * Fetch static GeoJSON from the bundled URL.
 */
async function loadStaticGeoJSON(rover: RoverName): Promise<GeoJSON.FeatureCollection> {
  const url = staticUrls[rover];
  if (!url) {
    console.warn(`No static data for ${rover}, returning empty collection`);
    return { type: "FeatureCollection", features: [] };
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load static GeoJSON for ${rover}: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.type || !data.features) {
    throw new Error(`Invalid GeoJSON structure for ${rover}`);
  }

  return data;
}

/**
 * Normalize feature properties to a consistent schema across all data sources.
 * Ensures every feature has: sol, dist_total_m, rover, lon, lat
 */
function normalizeFeatures(
  fc: GeoJSON.FeatureCollection,
  rover: RoverName
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => {
      const props = f.properties ?? {};
      const coords = f.geometry.type === "Point"
        ? (f.geometry as GeoJSON.Point).coordinates
        : [0, 0];

      return {
        ...f,
        properties: {
          ...props,
          sol: props.sol ?? 0,
          dist_total_m: props.dist_total_m ?? 0,
          rover,
          lon: coords[0],
          lat: coords[1],
          elevation: coords[2] ?? props.elev_geoid ?? null,
        },
      };
    }),
  };
}
