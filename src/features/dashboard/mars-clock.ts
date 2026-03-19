/**
 * F9: Mars Dual Clock & Sol Calculator.
 * Displays Mars Coordinated Time (MTC) and Local Mean Solar Time (LMST)
 * alongside Earth UTC. Real-time updates.
 */
import { ROVERS } from "../../config.ts";
import { getCurrentSol } from "../../utils/sol-date.ts";
import type { RoverName } from "../../types.ts";

let activeRover: RoverName = "perseverance";
let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the Mars dual clock widget.
 * Updates every second with current Mars and Earth times.
 */
export function initMarsClock(): void {
  // Listen for rover changes
  document.addEventListener("animation-state-change", ((e: CustomEvent) => {
    const { activeRover: rover } = e.detail as { activeRover: RoverName };
    activeRover = rover;
    updateClock();
  }) as EventListener);

  // Start real-time updates
  updateClock();
  intervalId = setInterval(updateClock, 1000);
}

/** Stop the clock updates (for cleanup). */
export function stopMarsClock(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** Update the clock display. */
function updateClock(): void {
  const container = document.getElementById("mars-clock");
  if (!container) return;

  const now = new Date();
  const config = ROVERS[activeRover];

  // Earth time
  const earthTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  // Current sol for active rover
  const currentSol = getCurrentSol(activeRover);

  const mtc = computeMTC(now);
  const lmst = computeLMST(mtc, config.landingLon);
  const lmstStr = formatMarsTime(lmst);

  // Compact inline clock for header
  container.innerHTML = `<span style="color:${config.color}">Sol ${currentSol.toLocaleString()}</span> <span style="opacity:0.5">|</span> ${lmstStr} LMST <span style="opacity:0.5">|</span> ${earthTime} UTC`;
}

/**
 * Compute Mars Coordinated Time from Earth UTC.
 * Returns fractional hours (0-24).
 */
function computeMTC(earthDate: Date): number {
  // Julian Date from UTC
  const jd = earthDate.getTime() / 86400000 + 2440587.5;
  // Mars Sol Date
  const msd = (jd - 2451549.5) / 1.02749125 + 44796.0 - 0.00096;
  // MTC = fractional part × 24
  const mtcHours = (msd % 1) * 24;
  return mtcHours < 0 ? mtcHours + 24 : mtcHours;
}

/**
 * Compute Local Mean Solar Time from MTC and longitude.
 * @param mtcHours - Mars Coordinated Time in fractional hours
 * @param longitude - Areocentric longitude in degrees east
 * @returns LMST in fractional hours (0-24)
 */
function computeLMST(mtcHours: number, longitude: number): number {
  const offset = (longitude / 360) * 24;
  let lmst = mtcHours + offset;
  while (lmst < 0) lmst += 24;
  while (lmst >= 24) lmst -= 24;
  return lmst;
}

/** Format fractional hours to HH:MM:SS string. */
function formatMarsTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.floor(((hours - h) * 60 - m) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
