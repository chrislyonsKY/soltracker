/**
 * F21: Mars panorama viewer.
 * Curated 360° panoramic mosaics from rover cameras displayed in a
 * full-screen viewer dialog.
 */

interface PanoramaEntry {
  id: string;
  rover: string;
  sol: number;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  camera: string;
}

/**
 * Curated notable panoramas with direct image URLs.
 * These are NASA/JPL published panoramic mosaics.
 */
const PANORAMAS: PanoramaEntry[] = [
  {
    id: "p1",
    rover: "perseverance",
    sol: 3,
    title: "First 360° Panorama",
    description: "Perseverance's first high-definition panoramic view of Jezero Crater.",
    imageUrl: "https://mars.nasa.gov/system/resources/detail_files/25611_PIA24264-web.jpg",
    thumbnailUrl: "https://mars.nasa.gov/system/resources/detail_files/25611_PIA24264-320.jpg",
    camera: "Mastcam-Z",
  },
  {
    id: "p2",
    rover: "curiosity",
    sol: 2946,
    title: "Glen Torridon Panorama",
    description: "1.8 billion pixel panorama stitched from 1,000+ Mastcam images at Glen Torridon.",
    imageUrl: "https://mars.nasa.gov/system/resources/detail_files/25382_PIA23623-web.jpg",
    thumbnailUrl: "https://mars.nasa.gov/system/resources/detail_files/25382_PIA23623-320.jpg",
    camera: "Mastcam",
  },
  {
    id: "p3",
    rover: "opportunity",
    sol: 4999,
    title: "Perseverance Valley Panorama",
    description: "One of Opportunity's final panoramas from Perseverance Valley on Endeavour Crater rim.",
    imageUrl: "https://mars.nasa.gov/system/resources/detail_files/25069_PIA22908-web.jpg",
    thumbnailUrl: "https://mars.nasa.gov/system/resources/detail_files/25069_PIA22908-320.jpg",
    camera: "Pancam",
  },
  {
    id: "p4",
    rover: "spirit",
    sol: 586,
    title: "Husband Hill Summit",
    description: "Spirit's panorama from the summit of Husband Hill in the Columbia Hills.",
    imageUrl: "https://mars.nasa.gov/system/resources/detail_files/25119_PIA03610-web.jpg",
    thumbnailUrl: "https://mars.nasa.gov/system/resources/detail_files/25119_PIA03610-320.jpg",
    camera: "Pancam",
  },
];

/**
 * Initialize the panorama viewer.
 * Renders a list of available panoramas and handles lightbox display.
 */
export function initPanoramaViewer(): void {
  const container = document.getElementById("panorama-list");
  if (!container) return;

  container.innerHTML = PANORAMAS.map((p) => `
    <div class="panorama-card" data-pano-id="${p.id}">
      <div class="panorama-thumb-wrap">
        <img src="${p.thumbnailUrl}" alt="${p.title}" loading="lazy" />
        <span class="panorama-rover-badge">${p.rover}</span>
      </div>
      <div class="panorama-info">
        <strong>${p.title}</strong>
        <span>Sol ${p.sol} — ${p.camera}</span>
      </div>
    </div>
  `).join("");

  // Wire click handlers
  container.addEventListener("click", (e) => {
    const card = (e.target as HTMLElement).closest("[data-pano-id]") as HTMLElement | null;
    if (!card) return;

    const id = card.dataset.panoId;
    const pano = PANORAMAS.find((p) => p.id === id);
    if (pano) openPanorama(pano);
  });
}

/** Open a panorama in the photo dialog. */
function openPanorama(pano: PanoramaEntry): void {
  const dialog = document.getElementById("photo-dialog");
  const img = document.getElementById("lightbox-img") as HTMLImageElement | null;
  const meta = document.getElementById("lightbox-meta");

  if (dialog) dialog.setAttribute("heading", pano.title);
  if (img) {
    img.src = pano.imageUrl;
    img.alt = pano.description;
  }
  if (meta) {
    meta.textContent = `${pano.camera} | Sol ${pano.sol} | ${pano.description}`;
  }

  dialog?.setAttribute("open", "");
}

/** Get panoramas for a specific rover. */
export function getPanoramasForRover(rover: string): PanoramaEntry[] {
  return PANORAMAS.filter((p) => p.rover === rover);
}
