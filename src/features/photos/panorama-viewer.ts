/**
 * F21: Mars panorama viewer.
 * Curated panoramic mosaics from rover cameras displayed in a lightbox.
 */

interface PanoramaEntry {
  id: string;
  rover: string;
  sol: number;
  title: string;
  description: string;
  imageUrl: string;
  camera: string;
}

/**
 * Curated notable panoramas from NASA/JPL published mosaics.
 */
const PANORAMAS: PanoramaEntry[] = [
  {
    id: "p1",
    rover: "perseverance",
    sol: 3,
    title: "First 360 Panorama",
    description: "Perseverance's first high-definition panoramic view of Jezero Crater, captured by Mastcam-Z.",
    imageUrl: "https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00003/ids/edr/browse/zcam/ZL0_0003_0667456955_000FDR_N0010052AUT_04096_034085J01.png",
    camera: "Mastcam-Z",
  },
  {
    id: "p2",
    rover: "curiosity",
    sol: 2946,
    title: "Glen Torridon Panorama",
    description: "Composite panorama from Glen Torridon, stitched from Mastcam images at the clay-bearing unit.",
    imageUrl: "https://mars.nasa.gov/msl-raw-images/msss/02946/mcam/2946ML0153290011200897C00_DXXX.jpg",
    camera: "Mastcam",
  },
  {
    id: "p3",
    rover: "curiosity",
    sol: 1000,
    title: "Sol 1000 Selfie",
    description: "Curiosity's Sol 1000 self-portrait at Pahrump Hills, Gale Crater.",
    imageUrl: "https://mars.nasa.gov/msl-raw-images/msss/01000/mcam/1000MR0044630360503668C00_DXXX.jpg",
    camera: "MAHLI",
  },
  {
    id: "p4",
    rover: "perseverance",
    sol: 198,
    title: "Jezero Delta View",
    description: "View of the ancient river delta from the crater floor, showing layered sedimentary rocks.",
    imageUrl: "https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00198/ids/edr/browse/zcam/ZR0_0198_0681736426_028ECM_N0070000ZCAM08198_034085J01.png",
    camera: "Mastcam-Z",
  },
];

/**
 * Initialize the panorama viewer with keyboard-accessible cards.
 */
export function initPanoramaViewer(): void {
  const container = document.getElementById("panorama-list");
  if (!container) return;

  container.innerHTML = PANORAMAS.map((p) => `
    <button class="panorama-card" data-pano-id="${p.id}" type="button" aria-label="View ${p.title} panorama from ${p.rover}">
      <div class="panorama-thumb-wrap">
        <img src="${p.imageUrl}" alt="${p.title} - ${p.description}" loading="lazy" />
        <span class="panorama-rover-badge">${p.rover}</span>
      </div>
      <div class="panorama-info">
        <strong>${p.title}</strong>
        <span>Sol ${p.sol} — ${p.camera}</span>
      </div>
    </button>
  `).join("");

  container.addEventListener("click", (e) => {
    const card = (e.target as HTMLElement).closest("[data-pano-id]") as HTMLElement | null;
    if (!card) return;
    const pano = PANORAMAS.find((p) => p.id === card.dataset.panoId);
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
    img.alt = `${pano.title} - ${pano.description}`;
  }
  if (meta) {
    meta.textContent = `${pano.camera} | Sol ${pano.sol} | ${pano.rover} | ${pano.description}`;
  }

  dialog?.setAttribute("open", "");
}

/** Get panoramas for a specific rover. */
export function getPanoramasForRover(rover: string): PanoramaEntry[] {
  return PANORAMAS.filter((p) => p.rover === rover);
}
