/**
 * Fetch wrapper for NASA MMGIS GeoJSON endpoints.
 * Handles timeouts, retries, and in-memory caching.
 */
import { MMGIS_BASE } from "../config.ts";

const cache = new Map<string, GeoJSON.FeatureCollection>();

/**
 * Fetch a GeoJSON layer from MMGIS with retry logic.
 * @param mission - Mission identifier ("M20" or "MSL")
 * @param layer - Layer name ("waypoints" or "traverse")
 * @returns Parsed GeoJSON FeatureCollection
 * @throws On persistent fetch failure or invalid data
 */
export async function fetchMMGIS(
  mission: "M20" | "MSL",
  layer: "waypoints" | "traverse"
): Promise<GeoJSON.FeatureCollection> {
  const cacheKeyStr = `${mission}_${layer}`;
  const cached = cache.get(cacheKeyStr);
  if (cached) return cached;

  const url = `${MMGIS_BASE}/${mission}/Layers/json/${mission}_${layer}.json`;
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`MMGIS ${mission}/${layer}: HTTP ${response.status}`);
      }

      const data = await response.json();

      // Validate basic GeoJSON structure
      if (!data.type || !data.features) {
        throw new Error(`MMGIS ${mission}/${layer}: invalid GeoJSON structure`);
      }

      cache.set(cacheKeyStr, data);
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error(`MMGIS ${mission}/${layer}: fetch failed`);
}
