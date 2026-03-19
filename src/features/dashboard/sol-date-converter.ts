/**
 * Sol-to-Earth date converter widget (part of F4/F9).
 * Interactive converter: enter a sol, see the Earth date, and vice versa.
 */
import { ROVER_NAMES, ROVERS } from "../../config.ts";
import { solToEarthDate, earthDateToSol } from "../../utils/sol-date.ts";
import { formatDate } from "../../utils/format.ts";
import type { RoverName } from "../../types.ts";

/**
 * Initialize the sol/date converter widget.
 */
export function initSolDateConverter(): void {
  const solInput = document.getElementById("converter-sol") as HTMLInputElement | null;
  const dateInput = document.getElementById("converter-date") as HTMLInputElement | null;
  const roverSelect = document.getElementById("converter-rover") as HTMLSelectElement | null;
  const resultEl = document.getElementById("converter-result");

  if (!solInput || !resultEl) return;

  // Populate rover select
  if (roverSelect) {
    roverSelect.innerHTML = ROVER_NAMES.map((r) =>
      `<calcite-option value="${r}">${ROVERS[r].displayName}</calcite-option>`
    ).join("");
  }

  // Sol → Date
  solInput.addEventListener("calciteInputInput", () => {
    const sol = parseInt(solInput.value, 10);
    const rover = (roverSelect?.value ?? "perseverance") as RoverName;
    if (!isNaN(sol) && sol >= 0) {
      const date = solToEarthDate(rover, sol);
      resultEl.textContent = formatDate(date);
    }
  });

  // Date → Sol (if date input exists)
  dateInput?.addEventListener("calciteInputDatePickerChange", () => {
    const val = dateInput.value;
    const rover = (roverSelect?.value ?? "perseverance") as RoverName;
    if (val) {
      const date = new Date(val + "T00:00:00Z");
      const sol = Math.floor(earthDateToSol(rover, date));
      resultEl.textContent = `Sol ${sol.toLocaleString()}`;
    }
  });
}
