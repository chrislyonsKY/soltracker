/**
 * F21: Mars panorama viewer.
 * Fetches notable photos via the NASA Mars Photos API for key mission sols.
 * Uses the same API as the photo gallery — URLs from this API work reliably.
 */
import { getPhotos } from "../../services/nasa-api.ts";
import type { NASAPhoto, RoverName } from "../../types.ts";

interface PanoramaSol {
  rover: RoverName;
  sol: number;
  title: string;
  camera?: string;
}

/** Notable sols with significant imagery. */
const NOTABLE_SOLS: PanoramaSol[] = [
  { rover: "perseverance", sol: 3, title: "First images from Jezero", camera: "NAVCAM_LEFT" },
  { rover: "perseverance", sol: 198, title: "Delta front approach", camera: "MCZ_RIGHT" },
  { rover: "perseverance", sol: 650, title: "Three Forks depot area" },
  { rover: "curiosity", sol: 1000, title: "Pahrump Hills, Sol 1000", camera: "MAST" },
  { rover: "curiosity", sol: 2946, title: "Glen Torridon clay unit", camera: "MAST" },
  { rover: "curiosity", sol: 3000, title: "Mount Sharp ascent" },
];

let loadedPhotos: Array<{ meta: PanoramaSol; photo: NASAPhoto }> = [];

/**
 * Initialize the panorama viewer.
 * Fetches a sample photo from each notable sol.
 */
export async function initPanoramaViewer(): Promise<void> {
  const container = document.getElementById("panorama-list");
  if (!container) return;

  container.innerHTML = '<span class="narrator-loading">Loading panoramas...</span>';

  const results: Array<{ meta: PanoramaSol; photo: NASAPhoto }> = [];

  // Fetch one photo from each notable sol (don't await all — show as they come)
  const promises = NOTABLE_SOLS.map(async (sol) => {
    try {
      const photos = await getPhotos(sol.rover, sol.sol, sol.camera);
      if (photos.length > 0) {
        results.push({ meta: sol, photo: photos[0] });
      }
    } catch {
      // Skip sols that fail
    }
  });

  await Promise.allSettled(promises);
  loadedPhotos = results;
  renderPanoramas(container);
}

/** Render panorama cards from loaded photos. */
function renderPanoramas(container: HTMLElement): void {
  if (loadedPhotos.length === 0) {
    container.innerHTML = '<span class="narrator-hint">No panoramas available</span>';
    return;
  }

  container.innerHTML = loadedPhotos.map((item) => `
    <button class="panorama-card" data-img-src="${item.photo.img_src}" type="button"
      aria-label="View ${item.meta.title} from ${item.meta.rover}">
      <div class="panorama-thumb-wrap">
        <img src="${item.photo.img_src}" alt="${item.meta.title}" loading="lazy" />
        <span class="panorama-rover-badge">${item.meta.rover}</span>
      </div>
      <div class="panorama-info">
        <strong>${item.meta.title}</strong>
        <span>Sol ${item.meta.sol} — ${item.photo.camera.full_name}</span>
      </div>
    </button>
  `).join("");

  container.addEventListener("click", (e) => {
    const card = (e.target as HTMLElement).closest("[data-img-src]") as HTMLElement | null;
    if (!card) return;
    const imgSrc = card.dataset.imgSrc ?? "";
    const title = card.querySelector("strong")?.textContent ?? "Panorama";
    const info = card.querySelector(".panorama-info span")?.textContent ?? "";
    openLightbox(imgSrc, title, info);
  });
}

/** Open image in lightbox dialog. */
function openLightbox(imgSrc: string, title: string, info: string): void {
  const dialog = document.getElementById("photo-dialog");
  const img = document.getElementById("lightbox-img") as HTMLImageElement | null;
  const meta = document.getElementById("lightbox-meta");

  if (dialog) dialog.setAttribute("heading", title);
  if (img) {
    img.src = imgSrc;
    img.alt = title;
  }
  if (meta) meta.textContent = info;
  dialog?.setAttribute("open", "");
}

/** Get loaded panorama photos for a specific rover. */
export function getPanoramasForRover(rover: string): NASAPhoto[] {
  return loadedPhotos
    .filter((item) => item.meta.rover === rover)
    .map((item) => item.photo);
}
