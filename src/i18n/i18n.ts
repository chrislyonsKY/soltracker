/**
 * Lightweight i18n system — JSON translation files + t() helper.
 * No framework dependency. Supports RTL languages.
 */

type TranslationDict = Record<string, string>;

const STORAGE_KEY = "soltracker_lang";
const DEFAULT_LANG = "en";

/** RTL languages that require dir="rtl" on <html> */
const RTL_LANGUAGES = new Set(["ar"]);

let currentLang = DEFAULT_LANG;
let translations: TranslationDict = {};
let fallback: TranslationDict = {};

/** Available languages with display names */
export const LANGUAGES: Array<{ code: string; name: string; nativeName: string }> = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
];

/**
 * Initialize the i18n system. Loads saved language or default.
 */
export async function initI18n(): Promise<void> {
  // Load English as fallback (always available)
  const enModule = await import("./en.json");
  fallback = enModule.default;

  // Check saved preference
  const saved = localStorage.getItem(STORAGE_KEY);
  const lang = saved && LANGUAGES.some((l) => l.code === saved) ? saved : DEFAULT_LANG;

  await setLanguage(lang);
}

/**
 * Switch to a new language.
 * @param langCode - ISO 639-1 language code
 */
export async function setLanguage(langCode: string): Promise<void> {
  currentLang = langCode;
  localStorage.setItem(STORAGE_KEY, langCode);

  if (langCode === "en") {
    translations = fallback;
  } else {
    try {
      const module = await import(`./${langCode}.json`);
      translations = module.default;
    } catch {
      console.warn(`Translation file for ${langCode} not found, falling back to English`);
      translations = fallback;
    }
  }

  // Handle RTL
  document.documentElement.dir = RTL_LANGUAGES.has(langCode) ? "rtl" : "ltr";
  document.documentElement.lang = langCode;

  // Re-render all translatable elements
  updateDOM();
}

/**
 * Get a translated string by key.
 * Falls back to English if key not found in current language.
 * @param key - Translation key (dot notation: "header.title")
 * @param params - Optional interpolation params { name: "value" }
 * @returns Translated string
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = translations[key] ?? fallback[key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }

  return text;
}

/** Get the current language code. */
export function getCurrentLanguage(): string {
  return currentLang;
}

/** Update all DOM elements with data-i18n attributes. */
function updateDOM(): void {
  const elements = document.querySelectorAll<HTMLElement>("[data-i18n]");
  for (const el of elements) {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = t(key);
    }
  }

  // Also update elements with data-i18n-title (for tooltips)
  const titleElements = document.querySelectorAll<HTMLElement>("[data-i18n-title]");
  for (const el of titleElements) {
    const key = el.dataset.i18nTitle;
    if (key) {
      el.title = t(key);
      el.setAttribute("aria-label", t(key));
    }
  }

  // Emit event so JS-rendered content can re-render
  document.dispatchEvent(new CustomEvent("language-change", { detail: { lang: currentLang } }));
}
