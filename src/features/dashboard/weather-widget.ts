/**
 * Curiosity REMS weather display widget.
 * Fetches weather data and displays the latest report.
 */
import { REMS_WEATHER_URL } from "../../config.ts";
import { formatTemperature } from "../../utils/format.ts";
import type { REMSWeatherResponse, REMSWeatherReport } from "../../types.ts";

const CACHE_TTL = 3_600_000; // 1 hour
let weatherCache: { data: REMSWeatherResponse; timestamp: number } | null = null;

/**
 * Initialize the weather widget — fetches latest REMS data and renders.
 */
export async function initWeatherWidget(): Promise<void> {
  try {
    const soles = await fetchWeather();
    const latest = getLatestReport(soles);
    if (latest) {
      renderWeather(latest);
    }
  } catch (err) {
    console.warn("Failed to load Mars weather:", err);
    setWeatherField("weather-temp", "Unavailable");
  }
}

/** Fetch REMS weather data with caching. */
async function fetchWeather(): Promise<REMSWeatherReport[]> {
  if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_TTL) {
    return weatherCache.data.soles;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(REMS_WEATHER_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`REMS HTTP ${response.status}`);

    const data: REMSWeatherResponse = await response.json();
    weatherCache = { data, timestamp: Date.now() };
    return data.soles;
  } finally {
    clearTimeout(timeout);
  }
}

/** Find the latest sol report. */
function getLatestReport(soles: REMSWeatherReport[]): REMSWeatherReport | null {
  if (!soles.length) return null;
  return soles.reduce((latest, current) =>
    Number(current.sol) > Number(latest.sol) ? current : latest
  );
}

/** Render weather data into the DOM. */
function renderWeather(report: REMSWeatherReport): void {
  const minTemp = parseFloat(report.min_temp ?? "");
  const maxTemp = parseFloat(report.max_temp ?? "");

  if (!isNaN(minTemp) && !isNaN(maxTemp)) {
    setWeatherField("weather-temp", `${formatTemperature(minTemp)} / ${formatTemperature(maxTemp)}`);
  } else {
    setWeatherField("weather-temp", "--");
  }

  setWeatherField("weather-pressure", report.pressure ? `${report.pressure} Pa` : "--");
  setWeatherField("weather-opacity", report.atmo_opacity ?? "--");
  setWeatherField("weather-season", report.season ?? "--");
  setWeatherField("weather-sunrise", report.sunrise ?? "--");
  setWeatherField("weather-sunset", report.sunset ?? "--");
}

/** Set text content of a weather element. */
function setWeatherField(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
