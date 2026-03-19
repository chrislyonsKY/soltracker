/**
 * F10: Drive efficiency analytics.
 * Computes per-rover driving statistics from waypoint data.
 */
import { ROVERS } from "../../config.ts";
import type { RoverName } from "../../types.ts";

interface DriveStats {
  totalDrivingSols: number;
  totalIdleSols: number;
  longestDriveM: number;
  longestDriveSol: number;
  avgDriveDistanceM: number;
  maxSol: number;
  distanceOverTime: Array<{ sol: number; distKm: number }>;
}

const statsCache = new Map<RoverName, DriveStats>();

/**
 * Compute drive analytics from waypoint features.
 * @param rover - Rover name
 * @param features - GeoJSON features sorted by sol
 * @returns Drive statistics
 */
export function computeDriveAnalytics(
  rover: RoverName,
  features: GeoJSON.Feature[]
): DriveStats {
  const cached = statsCache.get(rover);
  if (cached) return cached;

  const waypoints = features
    .filter((f) => f.geometry.type === "Point")
    .map((f) => {
      const props = f.properties ?? {};
      return {
        sol: props.sol ?? 0,
        dist_total_m: props.dist_total_m ?? 0,
      };
    })
    .sort((a, b) => a.sol - b.sol);

  if (waypoints.length === 0) {
    const empty: DriveStats = {
      totalDrivingSols: 0, totalIdleSols: 0,
      longestDriveM: 0, longestDriveSol: 0,
      avgDriveDistanceM: 0, maxSol: 0,
      distanceOverTime: [],
    };
    statsCache.set(rover, empty);
    return empty;
  }

  let totalDrivingSols = 0;
  let longestDriveM = 0;
  let longestDriveSol = 0;
  const drives: number[] = [];

  for (let i = 1; i < waypoints.length; i++) {
    const dist = waypoints[i].dist_total_m - waypoints[i - 1].dist_total_m;
    if (dist > 0) {
      totalDrivingSols++;
      drives.push(dist);
      if (dist > longestDriveM) {
        longestDriveM = dist;
        longestDriveSol = waypoints[i].sol;
      }
    }
  }

  const maxSol = waypoints[waypoints.length - 1].sol;
  const totalIdleSols = maxSol - totalDrivingSols;
  const avgDriveDistanceM = drives.length > 0 ? drives.reduce((a, b) => a + b, 0) / drives.length : 0;

  const distanceOverTime = waypoints.map((w) => ({
    sol: w.sol,
    distKm: w.dist_total_m / 1000,
  }));

  const stats: DriveStats = {
    totalDrivingSols, totalIdleSols,
    longestDriveM, longestDriveSol,
    avgDriveDistanceM, maxSol,
    distanceOverTime,
  };

  statsCache.set(rover, stats);
  return stats;
}

/**
 * Render drive analytics into the DOM.
 * @param rover - Rover name
 */
export function renderDriveAnalytics(rover: RoverName): void {
  const container = document.getElementById("drive-analytics");
  if (!container) return;

  const stats = statsCache.get(rover);
  if (!stats) {
    container.innerHTML = '<p style="color: #666;">No data available</p>';
    return;
  }

  const config = ROVERS[rover];
  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat-item">
        <span class="stat-label">Driving Sols</span>
        <span class="stat-value">${stats.totalDrivingSols.toLocaleString()}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Idle Sols</span>
        <span class="stat-value">${stats.totalIdleSols.toLocaleString()}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Longest Drive</span>
        <span class="stat-value">${stats.longestDriveM.toFixed(1)}m (Sol ${stats.longestDriveSol})</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Avg Drive</span>
        <span class="stat-value">${stats.avgDriveDistanceM.toFixed(1)}m/drive</span>
      </div>
    </div>
    ${renderDistanceChart(stats, config.color)}
  `;
}

/** Render cumulative distance SVG chart. */
function renderDistanceChart(stats: DriveStats, color: string): string {
  const data = stats.distanceOverTime;
  if (data.length < 2) return "";

  const w = 260, h = 80;
  const pad = { top: 5, right: 5, bottom: 15, left: 35 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  const maxSol = data[data.length - 1].sol || 1;
  const maxDist = data[data.length - 1].distKm || 1;

  const points = data.map((d) => {
    const x = pad.left + (d.sol / maxSol) * pw;
    const y = pad.top + ph - (d.distKm / maxDist) * ph;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block; margin-top:8px;">
      <path d="M${points.join(" L")}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.8"/>
      <text x="${pad.left - 4}" y="${pad.top + 4}" fill="#888" font-size="8" text-anchor="end">${maxDist.toFixed(1)}km</text>
      <text x="${pad.left + pw}" y="${pad.top + ph + 12}" fill="#888" font-size="8" text-anchor="end">Sol ${maxSol}</text>
    </svg>
  `;
}
