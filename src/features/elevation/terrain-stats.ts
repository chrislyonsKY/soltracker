/**
 * F19: Slope and terrain difficulty analysis.
 * Computes per-segment difficulty along the rover traverse.
 */
import { MARS_DEG_TO_M } from "../../config.ts";
import type { RoverName } from "../../types.ts";

export type DifficultyLevel = "easy" | "moderate" | "difficult" | "hazardous";

interface SegmentAnalysis {
  fromSol: number;
  toSol: number;
  slopeAngle: number;
  difficulty: DifficultyLevel;
  distanceM: number;
}

const analysisCache = new Map<RoverName, SegmentAnalysis[]>();

/**
 * Analyze terrain difficulty along a rover's traverse.
 * @param rover - Rover name
 * @param features - GeoJSON waypoint features
 * @returns Array of per-segment analyses
 */
export function analyzeTerrainDifficulty(
  rover: RoverName,
  features: GeoJSON.Feature[]
): SegmentAnalysis[] {
  const cached = analysisCache.get(rover);
  if (cached) return cached;

  const waypoints = features
    .filter((f) => f.geometry.type === "Point")
    .map((f) => {
      const coords = (f.geometry as GeoJSON.Point).coordinates;
      const props = f.properties ?? {};
      return {
        sol: props.sol ?? 0,
        lon: coords[0],
        lat: coords[1],
        elevation: coords[2] ?? props.elev_geoid ?? 0,
        dist_total_m: props.dist_total_m ?? 0,
      };
    })
    .sort((a, b) => a.sol - b.sol);

  const segments: SegmentAnalysis[] = [];

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];

    // Horizontal distance (approximate from lat/lon)
    const dLat = (curr.lat - prev.lat) * MARS_DEG_TO_M;
    const dLon = (curr.lon - prev.lon) * MARS_DEG_TO_M * Math.cos((prev.lat * Math.PI) / 180);
    const horizDist = Math.sqrt(dLat * dLat + dLon * dLon);

    // Elevation change
    const dElev = Math.abs(curr.elevation - prev.elevation);

    // Slope angle
    const slopeAngle = horizDist > 0 ? (Math.atan(dElev / horizDist) * 180) / Math.PI : 0;

    segments.push({
      fromSol: prev.sol,
      toSol: curr.sol,
      slopeAngle,
      difficulty: classifySlope(slopeAngle),
      distanceM: curr.dist_total_m - prev.dist_total_m,
    });
  }

  analysisCache.set(rover, segments);
  return segments;
}

/** Classify slope angle into difficulty level. */
function classifySlope(angleDeg: number): DifficultyLevel {
  if (angleDeg < 5) return "easy";
  if (angleDeg < 15) return "moderate";
  if (angleDeg < 25) return "difficult";
  return "hazardous";
}

/**
 * Get a summary of terrain difficulty for a rover.
 * @param rover - Rover name
 * @returns Object with counts per difficulty level
 */
export function getTerrainSummary(
  rover: RoverName
): Record<DifficultyLevel, number> {
  const segments = analysisCache.get(rover) ?? [];
  const summary: Record<DifficultyLevel, number> = {
    easy: 0, moderate: 0, difficult: 0, hazardous: 0,
  };

  for (const s of segments) {
    summary[s.difficulty]++;
  }

  return summary;
}
