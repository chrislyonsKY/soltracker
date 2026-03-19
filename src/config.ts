/**
 * Configuration registry: service URLs, rover metadata, and API key management.
 */
import type { RoverConfig, RoverName } from "./types.ts";

// --- Service URLs ---

export const MARS_DEM_URL =
  "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer";
export const MARS_VIKING_URL =
  "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer";
export const MARS_SHADED_RELIEF_URL =
  "https://astro.arcgis.com/arcgis/rest/services/OnMars/MColorDEM/MapServer";

export const MMGIS_BASE = "https://mars.nasa.gov/mmgis-maps";
export const M20_WAYPOINTS_URL = `${MMGIS_BASE}/M20/Layers/json/M20_waypoints.json`;
export const M20_TRAVERSE_URL = `${MMGIS_BASE}/M20/Layers/json/M20_traverse.json`;
export const MSL_WAYPOINTS_URL = `${MMGIS_BASE}/MSL/Layers/json/MSL_waypoints.json`;
export const MSL_TRAVERSE_URL = `${MMGIS_BASE}/MSL/Layers/json/MSL_traverse.json`;

export const NASA_PHOTOS_BASE = "https://api.nasa.gov/mars-photos/api/v1";
export const REMS_WEATHER_URL =
  "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json";

// --- Constants ---

export const MARS_WKID = 104971;
export const MARS_RADIUS_M = 3_396_190;
export const MARS_DEG_TO_M = (Math.PI / 180) * MARS_RADIUS_M; // ~59,274.5
export const MARS_SOL_SECONDS = 88_775.244;

// --- API Key Management ---

const NASA_API_KEY_STORAGE = "soltracker_nasa_api_key";
const ESRI_API_KEY_STORAGE = "soltracker_esri_api_key";
const NASA_DEMO_KEY = "DEMO_KEY";

/**
 * Get the NASA API key from localStorage, falling back to DEMO_KEY.
 * @returns The API key string
 */
export function getNasaApiKey(): string {
  return localStorage.getItem(NASA_API_KEY_STORAGE) ?? NASA_DEMO_KEY;
}

/**
 * Save a user-provided NASA API key to localStorage.
 * @param key - The API key to store
 */
export function setNasaApiKey(key: string): void {
  if (key && key !== NASA_DEMO_KEY) {
    localStorage.setItem(NASA_API_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(NASA_API_KEY_STORAGE);
  }
}

/**
 * Check if a user-provided API key is set (vs DEMO_KEY fallback).
 * @returns True if using a user-provided key
 */
export function hasUserApiKey(): boolean {
  return localStorage.getItem(NASA_API_KEY_STORAGE) !== null;
}

// --- Esri API Key Management ---

/**
 * Get the Esri API key from localStorage.
 * @returns The API key string or null if not set
 */
export function getEsriApiKey(): string | null {
  return localStorage.getItem(ESRI_API_KEY_STORAGE);
}

/**
 * Save an Esri API key to localStorage.
 * @param key - The API key to store
 */
export function setEsriApiKey(key: string): void {
  if (key) {
    localStorage.setItem(ESRI_API_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(ESRI_API_KEY_STORAGE);
  }
}

/**
 * Check if an Esri API key is configured.
 * @returns True if an Esri key is stored
 */
export function hasEsriApiKey(): boolean {
  return localStorage.getItem(ESRI_API_KEY_STORAGE) !== null;
}

// --- Rover Metadata ---

export const ROVERS: Record<RoverName, RoverConfig> = {
  perseverance: {
    name: "perseverance",
    displayName: "Perseverance",
    status: "active",
    landingDate: "2021-02-18",
    landingLat: 18.4446,
    landingLon: 77.4509,
    location: "Jezero Crater",
    color: "#E03C31",
    colorSecondary: "#C1440E",
    dataSource: "mmgis",
    mmgisMission: "M20",
    cameras: [
      { abbreviation: "NAVCAM_LEFT", fullName: "Navigation Camera - Left" },
      { abbreviation: "NAVCAM_RIGHT", fullName: "Navigation Camera - Right" },
      { abbreviation: "MCZ_RIGHT", fullName: "Mast Camera Zoom - Right" },
      { abbreviation: "MCZ_LEFT", fullName: "Mast Camera Zoom - Left" },
      { abbreviation: "FRONT_HAZCAM_LEFT_A", fullName: "Front Hazard Camera - Left" },
      { abbreviation: "FRONT_HAZCAM_RIGHT_A", fullName: "Front Hazard Camera - Right" },
      { abbreviation: "REAR_HAZCAM_LEFT", fullName: "Rear Hazard Camera - Left" },
      { abbreviation: "REAR_HAZCAM_RIGHT", fullName: "Rear Hazard Camera - Right" },
      { abbreviation: "SKYCAM", fullName: "MEDA SkyCam" },
      { abbreviation: "SHERLOC_WATSON", fullName: "SHERLOC WATSON Camera" },
    ],
  },
  curiosity: {
    name: "curiosity",
    displayName: "Curiosity",
    status: "active",
    landingDate: "2012-08-06",
    landingLat: -4.5895,
    landingLon: 137.4417,
    location: "Gale Crater",
    color: "#3A7BD5",
    colorSecondary: "#4A90D9",
    dataSource: "mmgis",
    mmgisMission: "MSL",
    cameras: [
      { abbreviation: "FHAZ", fullName: "Front Hazard Avoidance Camera" },
      { abbreviation: "RHAZ", fullName: "Rear Hazard Avoidance Camera" },
      { abbreviation: "MAST", fullName: "Mast Camera" },
      { abbreviation: "CHEMCAM", fullName: "Chemistry and Camera Complex" },
      { abbreviation: "MAHLI", fullName: "Mars Hand Lens Imager" },
      { abbreviation: "MARDI", fullName: "Mars Descent Imager" },
      { abbreviation: "NAVCAM", fullName: "Navigation Camera" },
    ],
  },
  opportunity: {
    name: "opportunity",
    displayName: "Opportunity",
    status: "complete",
    landingDate: "2004-01-25",
    landingLat: -1.9462,
    landingLon: -5.5266,
    location: "Meridiani Planum",
    color: "#D4A843",
    colorSecondary: "#C75B12",
    dataSource: "static",
    staticFile: "opportunity-traverse.geojson",
    maxSol: 5111,
    totalDistanceKm: 45.16,
    cameras: [
      { abbreviation: "FHAZ", fullName: "Front Hazard Avoidance Camera" },
      { abbreviation: "RHAZ", fullName: "Rear Hazard Avoidance Camera" },
      { abbreviation: "NAVCAM", fullName: "Navigation Camera" },
      { abbreviation: "PANCAM", fullName: "Panoramic Camera" },
      { abbreviation: "MINITES", fullName: "Miniature Thermal Emission Spectrometer" },
    ],
  },
  spirit: {
    name: "spirit",
    displayName: "Spirit",
    status: "complete",
    landingDate: "2004-01-04",
    landingLat: -14.5692,
    landingLon: 175.4729,
    location: "Gusev Crater",
    color: "#2E8B57",
    colorSecondary: "#1B3A6B",
    dataSource: "static",
    staticFile: "spirit-traverse.geojson",
    maxSol: 2210,
    totalDistanceKm: 7.73,
    cameras: [
      { abbreviation: "FHAZ", fullName: "Front Hazard Avoidance Camera" },
      { abbreviation: "RHAZ", fullName: "Rear Hazard Avoidance Camera" },
      { abbreviation: "NAVCAM", fullName: "Navigation Camera" },
      { abbreviation: "PANCAM", fullName: "Panoramic Camera" },
      { abbreviation: "MINITES", fullName: "Miniature Thermal Emission Spectrometer" },
    ],
  },
};

/** All rover names as an array for iteration */
export const ROVER_NAMES: RoverName[] = ["perseverance", "curiosity", "opportunity", "spirit"];
