/**
 * About dialog — shows app info, credits, and data sources.
 */

/**
 * Initialize the about dialog button handler.
 */
export function initAboutDialog(): void {
  const btn = document.getElementById("btn-about");
  const dialog = document.getElementById("about-dialog");

  btn?.addEventListener("click", () => {
    dialog?.setAttribute("open", "");
  });
}
