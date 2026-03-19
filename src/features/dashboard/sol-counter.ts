/**
 * F16: "This Sol in History" cross-mission timeline.
 * Shows what all rovers were doing at a given sol number.
 */
import { ROVERS, ROVER_NAMES } from "../../config.ts";
import { solToEarthDate } from "../../utils/sol-date.ts";
import { formatDate } from "../../utils/format.ts";
import milestonesData from "../../data/milestones.json";
import type { RoverName } from "../../types.ts";

interface Milestone {
  sol: number;
  title: string;
  description: string;
}

const milestones = milestonesData as Record<RoverName, Milestone[]>;

/**
 * Initialize the sol counter / "This Sol in History" widget.
 * Listens for sol-change events and shows cross-rover comparison.
 */
export function initSolCounter(): void {
  document.addEventListener("sol-change", ((e: CustomEvent) => {
    const { sol } = e.detail as { sol: number };
    renderSolHistory(sol);
  }) as EventListener);
}

/**
 * Render what each rover was doing at a given sol number.
 * @param sol - The sol number to compare across rovers
 */
function renderSolHistory(sol: number): void {
  const container = document.getElementById("sol-history");
  if (!container) return;

  const cards = ROVER_NAMES.map((rover) => {
    const config = ROVERS[rover];
    const maxSol = config.maxSol;

    // Check if this rover had reached this sol
    const earthDate = solToEarthDate(rover, sol);
    const wasActive = maxSol === undefined || sol <= maxSol;

    // Find closest milestone
    const roverMilestones = milestones[rover] ?? [];
    const closest = findClosestMilestone(roverMilestones, sol);

    let status: string;
    if (sol === 0) {
      status = "Landing Day";
    } else if (!wasActive) {
      status = "Mission not yet at this sol";
    } else {
      status = closest
        ? `Near: ${closest.title} (Sol ${closest.sol})`
        : `Active — Sol ${sol}`;
    }

    return `
      <div class="sol-history-card" style="border-left: 3px solid ${config.color};">
        <strong>${config.displayName}</strong>
        <span class="sol-history-date">${formatDate(earthDate)}</span>
        <span class="sol-history-status">${status}</span>
        ${closest && Math.abs(closest.sol - sol) <= 10
          ? `<span class="sol-history-desc">${closest.description}</span>`
          : ""}
      </div>
    `;
  });

  container.innerHTML = cards.join("");
}

/** Find the closest milestone to a given sol. */
function findClosestMilestone(ms: Milestone[], sol: number): Milestone | null {
  if (!ms.length) return null;
  let closest = ms[0];
  let minDiff = Math.abs(ms[0].sol - sol);

  for (const m of ms) {
    const diff = Math.abs(m.sol - sol);
    if (diff < minDiff) {
      closest = m;
      minDiff = diff;
    }
  }

  return minDiff <= 50 ? closest : null;
}
