/**
 * MER site-frame to areocentric coordinate conversion.
 * Used for pre-converting Spirit/Opportunity PDS CSV data to GeoJSON.
 */
import { MARS_DEG_TO_M } from "../../config.ts";

/**
 * Convert local site-frame coordinates to areocentric lat/lon.
 * @param xMeters - Local X offset in meters (easting)
 * @param yMeters - Local Y offset in meters (northing)
 * @param landerLat - Lander areocentric latitude in degrees
 * @param landerLon - Lander areocentric longitude in degrees
 * @returns Areocentric coordinates { lat, lon }
 */
export function siteFrameToAreocentric(
  xMeters: number,
  yMeters: number,
  landerLat: number,
  landerLon: number
): { lat: number; lon: number } {
  const latRadians = (landerLat * Math.PI) / 180;
  const deltaLat = yMeters / MARS_DEG_TO_M;
  const deltaLon = xMeters / (MARS_DEG_TO_M * Math.cos(latRadians));

  return {
    lat: landerLat + deltaLat,
    lon: landerLon + deltaLon,
  };
}
