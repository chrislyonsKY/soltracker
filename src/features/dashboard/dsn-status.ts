/**
 * F11: Deep Space Network live status.
 * Fetches DSN Now XML feed and displays active Mars communications.
 */

const DSN_URL = "https://eyes.nasa.gov/dsn/data/dsn.xml";

/** Known Mars-related DSN spacecraft names (partial matches) */
const MARS_NAMES_DSN = ["M20", "MSL", "PERSEVERANCE", "CURIOSITY", "MRO", "MAVEN", "ODYSSEY", "MEX"];

interface DSNDish {
  name: string;
  station: string;
  targets: string[];
  upSignal: boolean;
  downSignal: boolean;
}

/**
 * Initialize the DSN status widget.
 * Fetches DSN data and refreshes every 30 seconds.
 */
export function initDSNStatus(): void {
  fetchAndRender();
  setInterval(fetchAndRender, 30_000);
}

/** Fetch DSN XML and render Mars-related signals. */
async function fetchAndRender(): Promise<void> {
  const container = document.getElementById("dsn-status");
  if (!container) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(DSN_URL, {
      signal: controller.signal,
      mode: "cors",
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`DSN HTTP ${response.status}`);

    const text = await response.text();
    const dishes = parseDSNXml(text);
    const marsSignals = dishes.filter((d) =>
      d.targets.some((t) =>
        MARS_NAMES_DSN.some((name) => t.toUpperCase().includes(name))
      )
    );

    if (marsSignals.length === 0) {
      container.innerHTML = '<span class="dsn-idle">No active Mars links</span>';
    } else {
      container.innerHTML = marsSignals
        .map((d) => `
          <div class="dsn-signal ${d.downSignal ? "active" : ""}">
            <span class="dsn-antenna">${d.name}</span>
            <span class="dsn-target">${d.targets.join(", ")}</span>
            ${d.downSignal ? '<span class="dsn-indicator"></span>' : ""}
          </div>
        `)
        .join("");
    }
  } catch {
    container.innerHTML = '<span class="dsn-offline">DSN status unavailable</span>';
  }
}

/** Parse DSN XML into dish data. */
function parseDSNXml(xmlText: string): DSNDish[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const dishes: DSNDish[] = [];

  const dishEls = doc.querySelectorAll("dish");
  for (const dishEl of dishEls) {
    const name = dishEl.getAttribute("name") ?? "";
    const station = dishEl.getAttribute("friendlyName") ?? "";

    const targets: string[] = [];
    const targetEls = dishEl.querySelectorAll("target");
    for (const t of targetEls) {
      const targetName = t.getAttribute("name") ?? "";
      if (targetName) targets.push(targetName);
    }

    const downSignals = dishEl.querySelectorAll("downSignal");
    const upSignals = dishEl.querySelectorAll("upSignal");

    dishes.push({
      name,
      station,
      targets,
      upSignal: upSignals.length > 0,
      downSignal: downSignals.length > 0,
    });
  }

  return dishes;
}
