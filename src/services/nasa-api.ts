/**
 * NASA Mars image service.
 * Uses two endpoints since the old api.nasa.gov/mars-photos is offline:
 *
 * 1. Perseverance: mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020
 * 2. Curiosity: mars.nasa.gov/api/v1/raw_image_items/?mission=msl
 *
 * Both return working image URLs from mars.nasa.gov.
 * No API key required.
 */

/** Normalized photo result used across the app */
export interface MarsPhoto {
  id: string;
  sol: number;
  camera: string;
  cameraFullName: string;
  imgSrc: string;
  imgThumb: string;
  earthDate: string;
  rover: string;
}

const photoCache = new Map<string, MarsPhoto[]>();

function cacheKey(rover: string, sol: number, camera?: string): string {
  return `${rover}:${sol}:${camera ?? "all"}`;
}

/**
 * Fetch photos for a given rover and sol.
 * Routes to the correct NASA endpoint based on rover.
 * @param rover - Rover name (lowercase)
 * @param sol - Sol number
 * @param camera - Optional camera abbreviation filter
 * @returns Array of normalized photo results
 */
export async function getPhotos(
  rover: string,
  sol: number,
  camera?: string
): Promise<MarsPhoto[]> {
  const key = cacheKey(rover, sol, camera);
  const cached = photoCache.get(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    let photos: MarsPhoto[];

    if (rover === "perseverance") {
      photos = await fetchPerseverancePhotos(sol, camera, controller.signal);
    } else if (rover === "curiosity") {
      photos = await fetchCuriosityPhotos(sol, camera, controller.signal);
    } else {
      // Spirit/Opportunity — try the RSS feed with legacy category names
      photos = await fetchLegacyRoverPhotos(rover, sol, controller.signal);
    }

    photoCache.set(key, photos);
    return photos;
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetch Perseverance photos from RSS feed. */
async function fetchPerseverancePhotos(
  sol: number,
  camera: string | undefined,
  signal: AbortSignal
): Promise<MarsPhoto[]> {
  let url = `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=25&page=0&sol=${sol}`;
  if (camera) url += `&camera=${camera}`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`NASA RSS HTTP ${response.status}`);

  const data = await response.json();
  const images = data.images ?? [];

  return images.map((img: Record<string, unknown>): MarsPhoto => {
    const files = (img.image_files ?? {}) as Record<string, string>;
    const cam = (img.camera ?? {}) as Record<string, string>;
    return {
      id: String(img.imageid ?? ""),
      sol: Number(img.sol ?? sol),
      camera: String(cam.instrument ?? img.instrument ?? ""),
      cameraFullName: String(img.title ?? cam.instrument ?? "Unknown"),
      imgSrc: files.medium ?? files.small ?? files.large ?? "",
      imgThumb: files.small ?? files.medium ?? "",
      earthDate: String(img.date_taken_utc ?? img.date_received ?? ""),
      rover: "perseverance",
    };
  }).filter((p: MarsPhoto) => p.imgSrc);
}

/** Fetch Curiosity photos from raw image items API. */
async function fetchCuriosityPhotos(
  sol: number,
  camera: string | undefined,
  signal: AbortSignal
): Promise<MarsPhoto[]> {
  let url = `https://mars.nasa.gov/api/v1/raw_image_items/?order=sol+desc&per_page=25&mission=msl&sol=${sol}`;
  if (camera) url += `&search=${camera}`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`NASA API HTTP ${response.status}`);

  const data = await response.json();
  const items = data.items ?? [];

  return items.map((item: Record<string, unknown>): MarsPhoto => {
    const imgUrl = String(item.url ?? item.https_url ?? "");
    return {
      id: String(item.imageid ?? item.id ?? ""),
      sol: Number(item.sol ?? sol),
      camera: String(item.instrument ?? ""),
      cameraFullName: String(item.instrument ?? "Unknown"),
      imgSrc: imgUrl,
      imgThumb: imgUrl, // MSL API doesn't have separate thumbnails
      earthDate: String(item.date_taken_utc ?? ""),
      rover: "curiosity",
    };
  }).filter((p: MarsPhoto) => p.imgSrc);
}

/** Fetch Spirit/Opportunity photos — limited availability. */
async function fetchLegacyRoverPhotos(
  rover: string,
  sol: number,
  signal: AbortSignal
): Promise<MarsPhoto[]> {
  // Try the images search API as fallback
  const query = `${rover} mars rover sol ${sol}`;
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=10`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return [];

    const data = await response.json();
    const items = data.collection?.items ?? [];

    return items.slice(0, 10).map((item: Record<string, unknown>): MarsPhoto => {
      const itemData = ((item.data ?? []) as Record<string, unknown>[])[0] ?? {};
      const links = ((item.links ?? []) as Record<string, string>[]);
      const thumb = links[0]?.href ?? "";

      return {
        id: String(itemData.nasa_id ?? ""),
        sol,
        camera: "",
        cameraFullName: String(itemData.title ?? ""),
        imgSrc: thumb.replace("~thumb", "~medium"),
        imgThumb: thumb,
        earthDate: String(itemData.date_created ?? ""),
        rover,
      };
    }).filter((p: MarsPhoto) => p.imgThumb);
  } catch {
    return [];
  }
}
