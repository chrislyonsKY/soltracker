/**
 * F20: Raw image feed.
 * Fetches latest raw (unprocessed) images from NASA's Mars rovers.
 */

const RAW_IMAGE_URLS: Record<string, string> = {
  perseverance: "https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=10&page=0",
  curiosity: "https://mars.nasa.gov/rss/api/?feed=raw_images&category=msl&feedtype=json&num=10&page=0",
};

interface RawImage {
  imageid: string;
  caption: string;
  title: string;
  sol: number;
  date_taken: string;
  url: string;
  image_files: {
    small: string;
    medium: string;
    large: string;
    full_res: string;
  };
  camera: {
    name: string;
    full_name: string;
  };
}

/**
 * Initialize the raw image feed widget.
 * Fetches latest raw images and renders a ticker.
 */
export async function initRawImageFeed(): Promise<void> {
  const container = document.getElementById("raw-images");
  if (!container) return;

  try {
    const images = await fetchRawImages("perseverance");
    renderRawImages(container, images);

    // Refresh every 5 minutes
    setInterval(async () => {
      try {
        const fresh = await fetchRawImages("perseverance");
        renderRawImages(container, fresh);
      } catch {
        // Keep showing old images on refresh failure
      }
    }, 300_000);
  } catch {
    container.innerHTML = '<p style="color:#666; font-size:0.8rem;">Raw images unavailable</p>';
  }
}

/** Fetch raw images from NASA's feed. */
async function fetchRawImages(rover: string): Promise<RawImage[]> {
  const url = RAW_IMAGE_URLS[rover];
  if (!url) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return (data.images ?? []).slice(0, 10);
  } finally {
    clearTimeout(timeout);
  }
}

/** Render raw images into a horizontal scroll strip. */
function renderRawImages(container: HTMLElement, images: RawImage[]): void {
  if (images.length === 0) {
    container.innerHTML = '<p style="color:#666; font-size:0.8rem;">No recent raw images</p>';
    return;
  }

  container.innerHTML = `
    <div class="raw-image-strip">
      ${images.map((img) => `
        <div class="raw-image-thumb" title="${img.camera?.full_name ?? "Unknown"} — Sol ${img.sol ?? "?"}">
          <img src="${img.image_files?.small ?? img.url}" alt="Raw: ${img.title ?? "Mars image"}" loading="lazy" />
          <span class="raw-label">RAW</span>
        </div>
      `).join("")}
    </div>
    <p style="color:#555; font-size:0.65rem; margin:4px 0 0;">Unprocessed downlink — auto-refreshes</p>
  `;
}
