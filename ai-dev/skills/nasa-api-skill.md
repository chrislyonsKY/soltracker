# NASA API Integration Skill

Patterns for consuming NASA Mars data APIs client-side.

---

## MMGIS GeoJSON Fetching

NASA's MMGIS serves rover traverse data as standard GeoJSON. No auth required. Endpoints follow a predictable pattern.

```typescript
const MMGIS_BASE = "https://mars.nasa.gov/mmgis-maps";

async function fetchMMGIS(mission: "M20" | "MSL", layer: string): Promise<GeoJSON.FeatureCollection> {
  const url = `${MMGIS_BASE}/${mission}/Layers/json/${mission}_${layer}.json`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  
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
    
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
```

### Known MMGIS Endpoints

| Mission | Layer | URL suffix |
|---|---|---|
| M20 | Waypoints | `M20_waypoints.json` |
| M20 | Traverse | `M20_traverse.json` |
| M20 | Current position | `M20_waypoints_current.json` |
| M20 | Heli waypoints | `m20_heli_waypoints.json` |
| M20 | Heli flight path | `m20_heli_flight_path.json` |
| MSL | Waypoints | `MSL_waypoints.json` |
| MSL | Traverse | `MSL_traverse.json` |

---

## NASA Mars Rover Photos API

### Rate Limiter Pattern

```typescript
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per ms
  private lastRefill: number;
  private queue: Array<{ resolve: () => void }> = [];

  constructor(maxPerHour: number) {
    this.maxTokens = maxPerHour;
    this.tokens = maxPerHour;
    this.refillRate = maxPerHour / 3_600_000; // per millisecond
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    // Queue and wait for a token
    return new Promise((resolve) => {
      this.queue.push({ resolve });
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
    
    // Drain queue
    while (this.queue.length > 0 && this.tokens >= 1) {
      this.tokens -= 1;
      this.queue.shift()!.resolve();
    }
  }
}
```

### Caching Pattern

```typescript
const photoCache = new Map<string, NASAPhoto[]>();

function cacheKey(rover: string, sol: number, camera?: string): string {
  return `${rover}:${sol}:${camera ?? "all"}`;
}

async function getPhotos(rover: string, sol: number, camera?: string): Promise<NASAPhoto[]> {
  const key = cacheKey(rover, sol, camera);
  if (photoCache.has(key)) {
    return photoCache.get(key)!;
  }
  
  await rateLimiter.acquire();
  
  const params = new URLSearchParams({
    sol: String(sol),
    api_key: getApiKey()
  });
  if (camera) params.set("camera", camera);
  
  const url = `${NASA_PHOTOS_BASE}/rovers/${rover}/photos?${params}`;
  const response = await fetch(url);
  
  if (response.status === 429) {
    throw new RateLimitError("NASA API rate limit exceeded");
  }
  
  const data = await response.json();
  photoCache.set(key, data.photos);
  return data.photos;
}
```

---

## REMS Weather Feed

```typescript
const REMS_URL = "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json";
const WEATHER_CACHE_TTL = 3_600_000; // 1 hour

let weatherCache: { data: REMSWeatherResponse; timestamp: number } | null = null;

async function getWeather(): Promise<REMSWeatherReport[]> {
  if (weatherCache && Date.now() - weatherCache.timestamp < WEATHER_CACHE_TTL) {
    return weatherCache.data.soles;
  }
  
  const response = await fetch(REMS_URL);
  const data: REMSWeatherResponse = await response.json();
  weatherCache = { data, timestamp: Date.now() };
  
  return data.soles;
}

function getLatestWeather(soles: REMSWeatherReport[]): REMSWeatherReport | null {
  if (!soles.length) return null;
  // Soles may not be sorted — find highest sol number
  return soles.reduce((latest, current) =>
    Number(current.sol) > Number(latest.sol) ? current : latest
  );
}
```
