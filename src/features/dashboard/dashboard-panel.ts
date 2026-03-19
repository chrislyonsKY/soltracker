/**
 * Mission dashboard panel — displays current sol stats, mission summary.
 * Listens for sol-change events to update in real time.
 */
import { ROVERS } from "../../config.ts";
import { formatDistance, formatSol, formatDate } from "../../utils/format.ts";
import type { SolChangeDetail, RoverName } from "../../types.ts";

/**
 * Initialize the dashboard panel and begin listening for sol-change events.
 */
export function initDashboard(): void {
  // Set initial state for Perseverance
  const config = ROVERS.perseverance;
  setDashboardField("dashboard-rover-name", config.displayName);
  setDashboardField("dashboard-status", config.status === "active" ? "Active" : "Mission Complete");
  setDashboardField("dashboard-location", config.location);

  // Listen for sol-change events from animation engine
  document.addEventListener("sol-change", ((e: CustomEvent<SolChangeDetail>) => {
    const detail = e.detail;
    const roverConfig = ROVERS[detail.rover];

    setDashboardField("dashboard-rover-name", roverConfig.displayName);
    setDashboardField("dashboard-sol", formatSol(detail.sol));
    setDashboardField("dashboard-date", detail.earthDate ? formatDate(detail.earthDate) : "--");
    setDashboardField("dashboard-distance", formatDistance(detail.distanceMeters));
    setDashboardField("dashboard-status", roverConfig.status === "active" ? "Active" : "Mission Complete");
    setDashboardField("dashboard-location", roverConfig.location);

    // Color the rover name with mission color
    const nameEl = document.getElementById("dashboard-rover-name");
    if (nameEl) nameEl.style.color = roverConfig.color;
  }) as EventListener);

  // Listen for active rover changes
  document.addEventListener("animation-state-change", ((e: CustomEvent) => {
    const { activeRover } = e.detail as { activeRover: RoverName };
    const roverConfig = ROVERS[activeRover];
    setDashboardField("dashboard-rover-name", roverConfig.displayName);
    setDashboardField("dashboard-status", roverConfig.status === "active" ? "Active" : "Mission Complete");
    setDashboardField("dashboard-location", roverConfig.location);

    const nameEl = document.getElementById("dashboard-rover-name");
    if (nameEl) nameEl.style.color = roverConfig.color;
  }) as EventListener);
}

/** Helper to set text content of a dashboard element. */
function setDashboardField(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
