/**
 * F18: AI-Powered Science Narrator.
 * Uses the Anthropic Claude API (BYOK) to generate natural-language
 * explanations of what the rover is seeing at any given location.
 */
import type { SolChangeDetail } from "../types.ts";
import { ROVERS } from "../config.ts";

const ANTHROPIC_KEY_STORAGE = "soltracker_anthropic_api_key";
const BUILTIN_ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? "";
const narratorCache = new Map<string, string>();

/**
 * Initialize the AI narrator feature.
 * Listens for sol-change events and generates narration on demand.
 */
export function initAINarrator(): void {
  const btn = document.getElementById("btn-narrate");
  const container = document.getElementById("ai-narration");
  if (!btn || !container) return;

  let lastDetail: SolChangeDetail | null = null;

  document.addEventListener("sol-change", ((e: CustomEvent<SolChangeDetail>) => {
    lastDetail = e.detail;
    container.innerHTML = '<span class="narrator-hint">Click narrate for AI insight</span>';
  }) as EventListener);

  btn.addEventListener("click", async () => {
    if (!lastDetail) return;

    const key = getAnthropicKey();
    if (!key) {
      container.innerHTML = '<span class="narrator-hint">AI Narrator requires an Anthropic API key in Settings</span>';
      return;
    }
    container.innerHTML = '<span class="narrator-loading">Generating narration...</span>';

    try {
      const narration = await generateNarration(key, lastDetail);
      container.innerHTML = `
        <div class="narrator-text">${narration}</div>
        <span class="narrator-disclaimer">AI interpretation — not official NASA analysis</span>
      `;
    } catch (err) {
      container.innerHTML = `<span class="narrator-error">${err instanceof Error ? err.message : "Narration failed"}</span>`;
    }
  });
}

/** Generate narration using Claude API. */
async function generateNarration(apiKey: string, detail: SolChangeDetail): Promise<string> {
  const cacheKeyStr = `${detail.rover}:${detail.sol}`;
  const cached = narratorCache.get(cacheKeyStr);
  if (cached) return cached;

  const config = ROVERS[detail.rover];
  const earthDate = detail.earthDate ? detail.earthDate.toISOString().split("T")[0] : "unknown date";

  const prompt = `You are a Mars science communicator. In 2-3 concise sentences, describe what the ${config.displayName} rover was likely doing at Sol ${detail.sol} (Earth date: ${earthDate}) at coordinates ${detail.lat.toFixed(4)}°N, ${detail.lon.toFixed(4)}°E in ${config.location}. The rover had traveled ${(detail.distanceMeters / 1000).toFixed(2)} km total. ${detail.elevation !== null ? `Elevation: ${detail.elevation.toFixed(0)} meters.` : ""} Be scientifically accurate but accessible. Mention the geological context of the location.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Invalid Anthropic API key");
      throw new Error(`Claude API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "No narration generated.";
    narratorCache.set(cacheKeyStr, text);
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/** Get Anthropic API key from localStorage. */
export function getAnthropicKey(): string {
  return localStorage.getItem(ANTHROPIC_KEY_STORAGE) ?? BUILTIN_ANTHROPIC_KEY;
}

/** Set Anthropic API key in localStorage. */
export function setAnthropicKey(key: string): void {
  if (key) {
    localStorage.setItem(ANTHROPIC_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(ANTHROPIC_KEY_STORAGE);
  }
}
