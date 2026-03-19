/**
 * Centralized NASA API client with rate limiting and caching.
 * TODO(M3): Implement full photo fetching, rate limiter, and BYOK dialog
 */
import { getNasaApiKey, NASA_PHOTOS_BASE } from "../config.ts";
import type { NASAPhoto, NASAPhotoResponse } from "../types.ts";

const photoCache = new Map<string, NASAPhoto[]>();

function cacheKey(rover: string, sol: number, camera?: string): string {
  return `${rover}:${sol}:${camera ?? "all"}`;
}

/**
 * Fetch photos for a given rover and sol.
 * @param rover - Rover name (lowercase)
 * @param sol - Sol number
 * @param camera - Optional camera abbreviation filter
 * @returns Array of photo results
 * @throws On network or rate-limit errors
 */
export async function getPhotos(
  rover: string,
  sol: number,
  camera?: string
): Promise<NASAPhoto[]> {
  const key = cacheKey(rover, sol, camera);
  const cached = photoCache.get(key);
  if (cached) return cached;

  // TODO(M3): Add rate limiter (token bucket, 30/hr for DEMO_KEY)
  const params = new URLSearchParams({
    sol: String(sol),
    api_key: getNasaApiKey(),
  });
  if (camera) params.set("camera", camera);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(
      `${NASA_PHOTOS_BASE}/rovers/${rover}/photos?${params}`,
      { signal: controller.signal }
    );

    if (response.status === 429) {
      throw new Error("NASA API rate limit exceeded. Consider adding your own API key in Settings.");
    }
    if (!response.ok) {
      throw new Error(`NASA Photos API error: HTTP ${response.status}`);
    }

    const data: NASAPhotoResponse = await response.json();
    photoCache.set(key, data.photos);
    return data.photos;
  } finally {
    clearTimeout(timeout);
  }
}
