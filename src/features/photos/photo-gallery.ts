/**
 * Photo gallery — thumbnail grid synced to sol/position.
 * Subscribes to sol-change events and fetches rover photos.
 */
import { getPhotos } from "../../services/nasa-api.ts";
import type { NASAPhoto, SolChangeDetail, RoverName } from "../../types.ts";

let currentRover: RoverName = "perseverance";
let currentSol = 0;
let currentCamera: string | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialize the photo gallery panel.
 */
export function initPhotoGallery(): void {
  // Subscribe to sol-change events (debounced 500ms)
  document.addEventListener("sol-change", ((e: CustomEvent<SolChangeDetail>) => {
    currentRover = e.detail.rover;
    currentSol = e.detail.sol;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetchAndRender();
    }, 500);
  }) as EventListener);

  // Wire photo lightbox close
  const dialog = document.getElementById("photo-dialog");
  dialog?.addEventListener("calciteDialogClose", () => {
    const img = document.getElementById("lightbox-img") as HTMLImageElement | null;
    if (img) img.src = "";
  });
}

/** Set camera filter (called by camera-filter module). */
export function setPhotoCamera(camera: string | undefined): void {
  currentCamera = camera;
  fetchAndRender();
}

/** Fetch and render photos for the current rover/sol/camera. */
async function fetchAndRender(): Promise<void> {
  const gallery = document.getElementById("photo-gallery");
  if (!gallery) return;

  // Show loading state
  gallery.innerHTML = '<p class="photo-loading">Loading photos...</p>';

  try {
    const photos = await getPhotos(currentRover, currentSol, currentCamera);
    renderPhotos(gallery, photos);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load photos";
    gallery.innerHTML = `<p class="photo-error">${message}</p>`;
  }
}

/** Render photo thumbnails into the gallery container. */
function renderPhotos(container: HTMLElement, photos: NASAPhoto[]): void {
  if (photos.length === 0) {
    container.innerHTML = '<p class="photo-empty">No photos available for this sol</p>';
    return;
  }

  container.innerHTML = "";
  for (const photo of photos.slice(0, 25)) {
    const thumb = document.createElement("div");
    thumb.className = "photo-thumb";
    thumb.innerHTML = `
      <img src="${photo.img_src}" alt="${photo.camera.full_name} — Sol ${photo.sol}" loading="lazy" />
      <span class="photo-cam-label">${photo.camera.name}</span>
    `;
    thumb.addEventListener("click", () => openLightbox(photo));
    container.appendChild(thumb);
  }
}

/** Open the photo lightbox dialog with full-res image. */
function openLightbox(photo: NASAPhoto): void {
  const dialog = document.getElementById("photo-dialog");
  const img = document.getElementById("lightbox-img") as HTMLImageElement | null;
  const meta = document.getElementById("lightbox-meta");

  if (img) {
    img.src = photo.img_src;
    img.alt = `${photo.camera.full_name} — Sol ${photo.sol}`;
  }

  if (meta) {
    meta.textContent = `${photo.camera.full_name} | Sol ${photo.sol} | ${photo.earth_date}`;
  }

  dialog?.setAttribute("open", "");
}
