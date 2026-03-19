/**
 * Elevation profile along rover traverse path.
 * Uses elevation data from waypoint GeoJSON coordinates.
 * Renders an inline SVG chart with current position marker.
 */
import type { RoverName, SolChangeDetail } from "../../types.ts";

interface ElevationSample {
  sol: number;
  distance: number;
  elevation: number;
  lon: number;
  lat: number;
}

const profileCache = new Map<RoverName, ElevationSample[]>();
let currentMarkerSol = 0;

/**
 * Initialize the elevation profile event listeners.
 */
export async function initElevationProfile(): Promise<void> {
  document.addEventListener("sol-change", ((e: CustomEvent<SolChangeDetail>) => {
    currentMarkerSol = e.detail.sol;
    const cached = profileCache.get(e.detail.rover);
    if (cached) renderProfile(cached);
  }) as EventListener);

  document.addEventListener("animation-state-change", ((e: CustomEvent) => {
    const { activeRover } = e.detail as { activeRover: RoverName };
    const cached = profileCache.get(activeRover);
    if (cached) renderProfile(cached);
  }) as EventListener);
}

/**
 * Build the elevation profile for a rover from its waypoint features.
 * @param rover - Rover name
 * @param features - GeoJSON features with coordinates including Z
 */
export async function buildElevationProfile(
  rover: RoverName,
  features: GeoJSON.Feature[]
): Promise<void> {
  const samples = features
    .filter((f) => f.geometry.type === "Point")
    .map((f) => {
      const coords = (f.geometry as GeoJSON.Point).coordinates;
      const props = f.properties ?? {};
      return {
        sol: props.sol ?? 0,
        distance: props.dist_total_m ?? 0,
        lon: coords[0],
        lat: coords[1],
        elevation: coords[2] ?? props.elev_geoid ?? props.elevation ?? 0,
      };
    })
    .sort((a, b) => a.sol - b.sol);

  profileCache.set(rover, samples);
  renderProfile(samples);
  computeAndDisplayStats(samples);
}

/** Render the elevation profile as an inline SVG. */
function renderProfile(samples: ElevationSample[]): void {
  const container = document.getElementById("elevation-chart");
  if (!container || samples.length < 2) return;

  const width = container.clientWidth || 300;
  const height = 120;
  const pad = { top: 10, right: 10, bottom: 20, left: 45 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const elevs = samples.map((s) => s.elevation);
  const dists = samples.map((s) => s.distance / 1000);
  const minE = Math.min(...elevs);
  const maxE = Math.max(...elevs);
  const maxD = Math.max(...dists);
  const range = maxE - minE || 1;

  const toX = (d: number): number => pad.left + (d / maxD) * plotW;
  const toY = (e: number): number => pad.top + plotH - ((e - minE) / range) * plotH;

  const pathD = samples
    .map((s, i) => `${i === 0 ? "M" : "L"}${toX(dists[i]).toFixed(1)},${toY(s.elevation).toFixed(1)}`)
    .join(" ");

  // Current position marker
  let mx = pad.left, my = pad.top + plotH;
  for (let i = samples.length - 1; i >= 0; i--) {
    if (samples[i].sol <= currentMarkerSol) {
      mx = toX(dists[i]);
      my = toY(samples[i].elevation);
      break;
    }
  }

  container.innerHTML = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#333" stroke-width="1"/>
      <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="#333" stroke-width="1"/>
      <path d="${pathD} L${toX(maxD)},${pad.top + plotH} L${pad.left},${pad.top + plotH} Z" fill="#4fc3f7" opacity="0.1"/>
      <path d="${pathD}" fill="none" stroke="#4fc3f7" stroke-width="1.5" opacity="0.8"/>
      <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="4" fill="#ff5722" stroke="white" stroke-width="1.5"/>
      <text x="${pad.left - 4}" y="${pad.top + 4}" fill="#888" font-size="9" text-anchor="end">${maxE.toFixed(0)}m</text>
      <text x="${pad.left - 4}" y="${pad.top + plotH}" fill="#888" font-size="9" text-anchor="end">${minE.toFixed(0)}m</text>
      <text x="${pad.left + plotW}" y="${pad.top + plotH + 14}" fill="#888" font-size="9" text-anchor="end">${maxD.toFixed(1)} km</text>
    </svg>
  `;
}

/** Compute terrain stats and display them. */
function computeAndDisplayStats(samples: ElevationSample[]): void {
  if (samples.length < 2) return;

  let totalAscent = 0, totalDescent = 0;
  let minElev = Infinity, maxElev = -Infinity;

  for (let i = 0; i < samples.length; i++) {
    const e = samples[i].elevation;
    if (e < minElev) minElev = e;
    if (e > maxElev) maxElev = e;
    if (i > 0) {
      const diff = e - samples[i - 1].elevation;
      if (diff > 0) totalAscent += diff;
      else totalDescent += Math.abs(diff);
    }
  }

  setText("elev-min", `${minElev.toFixed(0)} m`);
  setText("elev-max", `${maxElev.toFixed(0)} m`);
  setText("elev-ascent", `+${totalAscent.toFixed(0)} m`);
  setText("elev-descent", `-${totalDescent.toFixed(0)} m`);
}

function setText(id: string, val: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
