# SolTracker — Field Schema Reference

All data models, API response schemas, and internal type definitions.

---

## 1. MMGIS Waypoint GeoJSON (Perseverance / Curiosity)

Source: `mars.nasa.gov/mmgis-maps/{M20|MSL}/Layers/json/{mission}_waypoints.json`

```typescript
interface MMGISWaypoint {
  type: "Feature";
  properties: {
    RMC: string;           // Rover Motion Counter "site_drive" (e.g., "3_0")
    site: number;          // Site number
    drive: number;         // Drive number within site
    sol: number;           // Mars sol number (0 = landing)
    easting: number;       // Local site frame meters
    northing: number;      // Local site frame meters
    elev_geoid: number;    // Elevation above Mars areoid (meters)
    elev_radii: number;    // Elevation relative to Mars center radii
    lon: number;           // Areocentric longitude (°E, -180 to 180)
    lat: number;           // Areocentric latitude (°N)
    roll: number;          // Rover attitude (degrees)
    pitch: number;
    yaw: number;
    dist_total_m: number;  // Cumulative distance in meters
    dist_km: number;       // Cumulative distance in km (may not exist on all)
    dist_mi?: number;      // Cumulative distance in miles (may not exist)
    final: "y" | "n";     // Whether this is final localization
    note?: string;         // Optional annotation
    date?: string;         // Earth date (ISO-ish, may not always be present)
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [lon, lat, elevation]
  };
}
```

---

## 2. MMGIS Traverse GeoJSON (Perseverance / Curiosity)

Source: `mars.nasa.gov/mmgis-maps/{M20|MSL}/Layers/json/{mission}_traverse.json`

```typescript
interface MMGISTraverse {
  type: "Feature";
  properties: {
    sol?: number;        // May or may not be per-segment
    [key: string]: any;  // Schema varies; traverse is primarily geometry
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number, number][]; // [lon, lat, elev][]
  };
}
```

Note: The traverse line is typically a single or few LineString features representing the full path. For animation, waypoints are more useful (one point per sol/drive).

---

## 3. MER Static GeoJSON (Spirit / Opportunity — pre-converted)

Converted from PDS Analyst's Notebook CSV. Stored in `src/data/`.

```typescript
interface MERWaypoint {
  type: "Feature";
  properties: {
    sol: number;            // Mars sol number
    site: number;           // Site number from CSV
    drive: number;          // Drive/position number
    x_local: number;        // Original local X (meters, for reference)
    y_local: number;        // Original local Y (meters, for reference)
    z_local?: number;       // Original local Z if available
    dist_total_m: number;   // Computed cumulative distance
    rover: "spirit" | "opportunity";
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat] in areocentric, converted
  };
}
```

---

## 4. Normalized Waypoint (Internal App Model)

Used across all features after loading from any source.

```typescript
interface NormalizedWaypoint {
  sol: number;
  earthDate: Date | null;
  lon: number;              // Areocentric longitude (°E, ±180)
  lat: number;              // Areocentric latitude (°N)
  elevation: number | null; // Meters above areoid
  distanceMeters: number;   // Cumulative distance from landing
  rover: RoverName;
  site?: number;
  drive?: number;
}
```

---

## 5. NASA Mars Rover Photos API

### Photo Response

```typescript
interface NASAPhoto {
  id: number;
  sol: number;
  camera: {
    id: number;
    name: string;        // Abbreviation (e.g., "MCZ_RIGHT")
    full_name: string;   // Full name (e.g., "Mast Camera Zoom - Right")
    rover_id: number;
  };
  img_src: string;       // Full URL to image
  earth_date: string;    // "YYYY-MM-DD"
  rover: {
    id: number;
    name: string;        // "Perseverance", "Curiosity", etc.
    landing_date: string;
    launch_date: string;
    status: "active" | "complete";
  };
}

interface NASAPhotoResponse {
  photos: NASAPhoto[];
}
```

### Mission Manifest

```typescript
interface NASAManifest {
  photo_manifest: {
    name: string;
    landing_date: string;
    launch_date: string;
    status: "active" | "complete";
    max_sol: number;
    max_date: string;
    total_photos: number;
    photos: Array<{
      sol: number;
      earth_date: string;
      total_photos: number;
      cameras: string[];
    }>;
  };
}
```

---

## 6. Curiosity REMS Weather

Source: `mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json`

```typescript
interface REMSWeatherReport {
  sol: string;                    // Sol number as string
  terrestrial_date: string;       // "YYYY-MM-DD"
  min_temp: string | null;        // °C as string, or null/"--"
  max_temp: string | null;        // °C as string
  pressure: string | null;        // Pa as string
  atmo_opacity: string | null;    // "Sunny", "Cloudy", etc.
  local_uv_irradiance_index: string | null; // "Moderate", "High", etc.
  min_gts_temp: string | null;    // Ground temp °C
  max_gts_temp: string | null;    // Ground temp °C
  sunrise: string;                // "HH:MM" local Mars time
  sunset: string;                 // "HH:MM" local Mars time
  ls: string;                     // Solar longitude (0-360)
  season: string;                 // "Month N"
  wind_speed: string | null;      // Usually "--" (sensor failed ~Sol 1485)
  wind_direction: string | null;  // Usually "--"
  abs_humidity: string | null;    // Usually "--"
}

interface REMSWeatherResponse {
  descriptions: Record<string, { description: string }>;
  soles: REMSWeatherReport[];
}
```

---

## 7. Rover Configuration (Internal)

```typescript
type RoverName = "perseverance" | "curiosity" | "opportunity" | "spirit";

interface RoverConfig {
  name: RoverName;
  displayName: string;
  status: "active" | "complete";
  landingDate: string;            // ISO date
  landingLat: number;             // Areocentric latitude
  landingLon: number;             // Areocentric longitude (±180)
  location: string;               // Landing site name
  color: string;                  // Hex color
  colorSecondary: string;         // Hex secondary/accent
  dataSource: "mmgis" | "static";
  mmgisMission?: "M20" | "MSL";  // Only for mmgis sources
  staticFile?: string;            // Only for static sources
  cameras: CameraInfo[];
  maxSol?: number;                // Known max sol (for static rovers)
  totalDistanceKm?: number;       // Known total distance (for static rovers)
}

interface CameraInfo {
  abbreviation: string;
  fullName: string;
}
```

---

## 8. Animation State

```typescript
interface AnimationState {
  activeRover: RoverName;
  currentSol: number;
  maxSol: number;
  isPlaying: boolean;
  speed: 1 | 5 | 10 | 50;       // Sols per second
  followCamera: boolean;
}

// Custom event emitted on document
interface SolChangeDetail {
  rover: RoverName;
  sol: number;
  lon: number;
  lat: number;
  elevation: number | null;
  distanceMeters: number;
  earthDate: Date | null;
}
```

---

## 9. API Key Configuration

```typescript
interface ApiKeyConfig {
  nasaApiKey: string | null;       // User-provided or null
  esriApiKey: string | null;       // Optional Esri API key
}

// Storage: localStorage keys
const NASA_API_KEY_STORAGE = "soltracker_nasa_api_key";
const ESRI_API_KEY_STORAGE = "soltracker_esri_api_key";
const NASA_DEMO_KEY = "DEMO_KEY";
```

---

## 10. Coordinate Constants

```typescript
const MARS_RADIUS_M = 3_396_190;                    // Mars_2000_IAU_IAG semi-major axis
const MARS_DEG_TO_M = (Math.PI / 180) * MARS_RADIUS_M; // 59,274.5 meters per degree
const MARS_SOL_SECONDS = 88_775.244;                 // Duration of one Mars sol in Earth seconds
const MARS_WKID = 104971;                            // Mars_2000_(Sphere)
```
