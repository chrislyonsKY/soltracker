/**
 * Number and date formatting helpers.
 */

/**
 * Format a distance in meters to a human-readable string.
 * @param meters - Distance in meters
 * @returns Formatted string like "12.4 km (7.7 mi)"
 */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  const mi = km * 0.621371;
  return `${km.toFixed(2)} km (${mi.toFixed(2)} mi)`;
}

/**
 * Format a Celsius temperature with Fahrenheit equivalent.
 * @param celsius - Temperature in Celsius
 * @returns Formatted string like "-64°C (-83°F)"
 */
export function formatTemperature(celsius: number): string {
  const fahrenheit = celsius * 9 / 5 + 32;
  return `${Math.round(celsius)}°C (${Math.round(fahrenheit)}°F)`;
}

/**
 * Format a sol number with commas.
 * @param sol - Sol number
 * @returns Formatted string like "Sol 1,432"
 */
export function formatSol(sol: number): string {
  return `Sol ${sol.toLocaleString()}`;
}

/**
 * Format a Date to a readable string.
 * @param date - Date to format
 * @returns Formatted string like "Mar 19, 2026"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
