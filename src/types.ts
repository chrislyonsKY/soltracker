/**
 * Shared TypeScript interfaces for SolTracker.
 */

/** Valid rover identifier */
export type RoverName = "perseverance" | "curiosity" | "opportunity" | "spirit";

/** Camera abbreviation and full name */
export interface CameraInfo {
  abbreviation: string;
  fullName: string;
}

/** Per-rover configuration metadata */
export interface RoverConfig {
  name: RoverName;
  displayName: string;
  status: "active" | "complete";
  landingDate: string;
  landingLat: number;
  landingLon: number;
  location: string;
  color: string;
  colorSecondary: string;
  dataSource: "mmgis" | "static";
  mmgisMission?: "M20" | "MSL";
  staticFile?: string;
  cameras: CameraInfo[];
  maxSol?: number;
  totalDistanceKm?: number;
}

/** MMGIS waypoint feature properties (Perseverance / Curiosity) */
export interface MMGISWaypointProperties {
  RMC: string;
  site: number;
  drive: number;
  sol: number;
  easting: number;
  northing: number;
  elev_geoid: number;
  elev_radii: number;
  lon: number;
  lat: number;
  roll: number;
  pitch: number;
  yaw: number;
  dist_total_m: number;
  dist_km?: number;
  dist_mi?: number;
  final: "y" | "n";
  note?: string;
  date?: string;
}

/** MER static GeoJSON feature properties (Spirit / Opportunity) */
export interface MERWaypointProperties {
  sol: number;
  site: number;
  drive: number;
  x_local: number;
  y_local: number;
  z_local?: number;
  dist_total_m: number;
  rover: "spirit" | "opportunity";
}

/** Normalized waypoint used across all features */
export interface NormalizedWaypoint {
  sol: number;
  earthDate: Date | null;
  lon: number;
  lat: number;
  elevation: number | null;
  distanceMeters: number;
  rover: RoverName;
  site?: number;
  drive?: number;
}

/** Animation playback state */
export interface AnimationState {
  activeRover: RoverName;
  currentSol: number;
  maxSol: number;
  isPlaying: boolean;
  speed: 1 | 5 | 10 | 50;
  followCamera: boolean;
}

/** Custom event detail for sol changes */
export interface SolChangeDetail {
  rover: RoverName;
  sol: number;
  lon: number;
  lat: number;
  elevation: number | null;
  distanceMeters: number;
  earthDate: Date | null;
}

/** NASA Mars Rover Photos API response types */
export interface NASAPhoto {
  id: number;
  sol: number;
  camera: {
    id: number;
    name: string;
    full_name: string;
    rover_id: number;
  };
  img_src: string;
  earth_date: string;
  rover: {
    id: number;
    name: string;
    landing_date: string;
    launch_date: string;
    status: "active" | "complete";
  };
}

export interface NASAPhotoResponse {
  photos: NASAPhoto[];
}

/** REMS weather report from Curiosity */
export interface REMSWeatherReport {
  sol: string;
  terrestrial_date: string;
  min_temp: string | null;
  max_temp: string | null;
  pressure: string | null;
  atmo_opacity: string | null;
  local_uv_irradiance_index: string | null;
  min_gts_temp: string | null;
  max_gts_temp: string | null;
  sunrise: string;
  sunset: string;
  ls: string;
  season: string;
  wind_speed: string | null;
  wind_direction: string | null;
  abs_humidity: string | null;
}

export interface REMSWeatherResponse {
  descriptions: Record<string, { description: string }>;
  soles: REMSWeatherReport[];
}

/** API key configuration */
export interface ApiKeyConfig {
  nasaApiKey: string | null;
  esriApiKey: string | null;
}
