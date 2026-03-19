/**
 * Photo gallery — thumbnail grid synced to sol/position.
 * Uses the new NASA RSS feed / raw image API endpoints.
 */
import { getPhotos } from "../../services/nasa-api.ts";
import type { MarsPhoto } from "../../services/nasa-api.ts";
import type { SolChangeDetail, RoverName } from "../../types.ts";

let currentRover: RoverName = "perseverance";
let currentSol = 0;
let currentCamera: string | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialize the photo gallery panel.
 */
export function initPhotoGallery(): void {
  document.addEventListener("sol-change", ((e: CustomEvent<SolChangeDetail>) => {
    currentRover = e.detail.rover;
    currentSol = e.detail.sol;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchAndRender(), 500);
  }) as EventListener);

  const dialog = document.getElementById("photo-dialog");
  dialog?.addEventListener("calciteDialogClose", () => {
    const img = document.getElementById("lightbox-img") as HTMLImageElement | null;
    if (img) img.src = "";
  });
}

/** Set camera filter. */
export function setPhotoCamera(camera: string | undefined): void {
  currentCamera = camera;
  fetchAndRender();
}

/** Fetch and render photos for current state. */
async function fetchAndRender(): Promise<void> {
  const gallery = document.getElementById("photo-gallery");
  if (!gallery) return;

  gallery.innerHTML = '<p class="photo-loading">Loading photos...</p>';

  try {
    const photos = await getPhotos(currentRover, currentSol, currentCamera);
    renderPhotos(gallery, photos);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load photos";
    gallery.innerHTML = `<p class="photo-error">${msg}</p>`;
  }
}

/** Render photo thumbnails. */
function renderPhotos(container: HTMLElement, photos: MarsPhoto[]): void {
  if (photos.length === 0) {
    container.innerHTML = '<p class="photo-empty">No photos for this sol</p>';
    return;
  }

  container.innerHTML = "";
  for (const photo of photos.slice(0, 25)) {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "photo-thumb";
    thumb.setAttribute("aria-label", `${photo.camera || "Photo"} from Sol ${photo.sol}`);
    thumb.innerHTML = `
      <img src="${photo.imgThumb}" alt="${photo.cameraFullName} — Sol ${photo.sol}" loading="lazy" />
      <span class="photo-cam-label">${photo.camera || "IMG"}</span>
    `;
    thumb.addEventListener("click", () => openLightbox(photo));
    container.appendChild(thumb);
  }
}

/** Open photo in lightbox dialog. */
function openLightbox(photo: MarsPhoto): void {
  const dialog = document.getElementById("photo-dialog");
  const img = document.getElementById("lightbox-img") as HTMLImageElement | null;
  const meta = document.getElementById("lightbox-meta");

  if (img) {
    img.src = photo.imgSrc;
    img.alt = `${photo.cameraFullName} — Sol ${photo.sol}`;
  }
  if (meta) {
    meta.textContent = `${photo.camera} | Sol ${photo.sol} | ${photo.earthDate} | ${photo.rover}`;
  }
  dialog?.setAttribute("open", "");
}
