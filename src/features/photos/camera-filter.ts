/**
 * Camera selection dropdown for photo filtering.
 * Populates based on the active rover's camera list.
 */
import { ROVERS } from "../../config.ts";
import { setPhotoCamera } from "./photo-gallery.ts";
import type { RoverName } from "../../types.ts";

/**
 * Initialize the camera filter dropdown.
 * Listens for rover changes to update the camera list.
 */
export function initCameraFilter(): void {
  const select = document.getElementById("camera-select");
  if (!select) return;

  // Populate for initial rover
  populateCameras("perseverance");

  // Update cameras when active rover changes
  document.addEventListener("animation-state-change", ((e: CustomEvent) => {
    const { activeRover } = e.detail;
    populateCameras(activeRover);
  }) as EventListener);

  // On camera change, update photo gallery
  select.addEventListener("calciteSelectChange", () => {
    const val = (select as HTMLSelectElement).value;
    setPhotoCamera(val === "all" ? undefined : val);
  });
}

/** Populate the camera dropdown for a given rover. */
function populateCameras(rover: RoverName): void {
  const select = document.getElementById("camera-select");
  if (!select) return;

  const config = ROVERS[rover];

  // Keep the "All Cameras" option, replace the rest
  select.innerHTML = '<calcite-option value="all" selected>All Cameras</calcite-option>';

  for (const cam of config.cameras) {
    const option = document.createElement("calcite-option");
    option.setAttribute("value", cam.abbreviation);
    option.textContent = `${cam.abbreviation} — ${cam.fullName}`;
    select.appendChild(option);
  }
}
