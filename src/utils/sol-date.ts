/**
 * Sol-to-Earth date conversion utilities.
 *
 * One Mars sol = 88,775.244 Earth seconds (24h 39m 35.244s).
 */
import { MARS_SOL_SECONDS, ROVERS } from "../config.ts";
import type { RoverName } from "../types.ts";

/**
 * Convert a rover sol number to an Earth Date.
 * @param rover - Rover name
 * @param sol - Sol number (0 = landing day)
 * @returns Corresponding Earth date
 */
export function solToEarthDate(rover: RoverName, sol: number): Date {
  const landingDate = new Date(ROVERS[rover].landingDate + "T00:00:00Z");
  const offsetMs = sol * MARS_SOL_SECONDS * 1000;
  return new Date(landingDate.getTime() + offsetMs);
}

/**
 * Convert an Earth date to the corresponding sol number for a rover.
 * @param rover - Rover name
 * @param date - Earth date
 * @returns Sol number (may be fractional)
 */
export function earthDateToSol(rover: RoverName, date: Date): number {
  const landingDate = new Date(ROVERS[rover].landingDate + "T00:00:00Z");
  const diffMs = date.getTime() - landingDate.getTime();
  return diffMs / (MARS_SOL_SECONDS * 1000);
}

/**
 * Get the current sol for an active rover (based on today's date).
 * @param rover - Rover name
 * @returns Current sol number (floored to integer)
 */
export function getCurrentSol(rover: RoverName): number {
  return Math.floor(earthDateToSol(rover, new Date()));
}
