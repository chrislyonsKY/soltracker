/**
 * F21: Mars panorama viewer.
 * Curated panoramic images from all four rovers, served locally
 * from public/panoramas/ (sourced from NASA Images API).
 */

interface PanoramaEntry {
  id: string;
  rover: string;
  title: string;
  description: string;
  imageUrl: string;
  camera: string;
  nasaId: string;
}

const BASE = "./panoramas/";

const PANORAMAS: PanoramaEntry[] = [
  {
    id: "p1", rover: "perseverance",
    title: "Navcam 360° Panorama",
    description: "First full 360-degree panorama from Perseverance's navigation cameras at Jezero Crater.",
    imageUrl: `${BASE}perseverance-navcam-360.jpg`,
    camera: "Navcam", nasaId: "PIA24422",
  },
  {
    id: "p2", rover: "perseverance",
    title: "Mastcam-Z First Panorama",
    description: "Mastcam-Z's first high-resolution 360-degree panorama, stitched from 79 images on Sol 4.",
    imageUrl: `${BASE}perseverance-mastcamz-360.jpg`,
    camera: "Mastcam-Z", nasaId: "PIA24264",
  },
  {
    id: "p3", rover: "perseverance",
    title: "Sample Return Landing Site",
    description: "Panoramic view of the potential Mars Sample Return landing site in Jezero Crater.",
    imageUrl: `${BASE}perseverance-sample-return-site.jpg`,
    camera: "Mastcam-Z", nasaId: "PIA25406",
  },
  {
    id: "p4", rover: "perseverance",
    title: "Perseverance's Office on Mars",
    description: "The rover's workspace showing ancient delta deposits and layered sedimentary rocks.",
    imageUrl: `${BASE}perseverance-office.jpg`,
    camera: "Mastcam-Z", nasaId: "PIA24765",
  },
  {
    id: "p5", rover: "curiosity",
    title: "Gediz Vallis Channel",
    description: "View within the ancient Gediz Vallis Channel carved by water or debris flows on Mount Sharp.",
    imageUrl: `${BASE}curiosity-gediz-vallis.jpg`,
    camera: "Mastcam", nasaId: "PIA26410",
  },
  {
    id: "p6", rover: "curiosity",
    title: "Iridescent Clouds",
    description: "Rare mother-of-pearl iridescent clouds spotted in the Martian sky above Gale Crater.",
    imageUrl: `${BASE}curiosity-clouds.jpg`,
    camera: "Navcam", nasaId: "PIA24662",
  },
  {
    id: "p7", rover: "curiosity",
    title: "Gale Crater Rim",
    description: "Curiosity's view of Gale Crater's rim, homing in on ancient river deposits.",
    imageUrl: `${BASE}curiosity-gale-rim.jpg`,
    camera: "Mastcam", nasaId: "PIA26671",
  },
  {
    id: "p8", rover: "spirit",
    title: "McMurdo Panorama",
    description: "Spirit's McMurdo panorama from the Columbia Hills, one of the most detailed Mars panoramas ever captured.",
    imageUrl: `${BASE}spirit-mcmurdo-panorama.jpg`,
    camera: "Pancam", nasaId: "PIA16440",
  },
  {
    id: "p9", rover: "opportunity",
    title: "Victoria Crater",
    description: "Opportunity's view approaching the 800-meter diameter Victoria Crater on Meridiani Planum.",
    imageUrl: `${BASE}opportunity-victoria.jpg`,
    camera: "Pancam", nasaId: "PIA11753",
  },
  {
    id: "p10", rover: "opportunity",
    title: "Eagle Crater Landing",
    description: "View from Eagle Crater where Opportunity landed, showing exposed bedrock — the famous 'hole in one.'",
    imageUrl: `${BASE}opportunity-eagle.jpg`,
    camera: "Pancam", nasaId: "PIA03240",
  },
];

/**
 * Initialize the panorama viewer with locally-served images.
 */
export function initPanoramaViewer(): void {
  const container = document.getElementById("panorama-list");
  if (!container) return;

  container.innerHTML = PANORAMAS.map((p) => `
    <button class="panorama-card" data-pano-id="${p.id}" type="button"
      aria-label="View ${p.title} panorama from ${p.rover}">
      <div class="panorama-thumb-wrap">
        <img src="${p.imageUrl}" alt="${p.title} - ${p.description}" loading="lazy" />
        <span class="panorama-rover-badge">${p.rover}</span>
      </div>
      <div class="panorama-info">
        <strong>${p.title}</strong>
        <span>${p.rover} — ${p.camera}</span>
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
    meta.textContent = `${pano.camera} | ${pano.rover} | ${pano.description} (NASA ${pano.nasaId})`;
  }
  dialog?.setAttribute("open", "");
}

/** Get panoramas for a specific rover. */
export function getPanoramasForRover(rover: string): PanoramaEntry[] {
  return PANORAMAS.filter((p) => p.rover === rover);
}
