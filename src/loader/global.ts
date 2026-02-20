/**
 * FINALFORM GLOBAL HELPER
 *
 * This lightweight script runs in the main document context (outside Shadow DOM).
 * Its primary purpose is to provide a stable container for "Portal" elements
 * like Sticky CTAs and Popups that need to break out of the Shadow DOM constraints.
 */

(function () {
  const CONTAINER_ID = "finalform-overlay-container";

  function ensureContainer() {
    if (document.getElementById(CONTAINER_ID)) return;

    const host = document.createElement("div");
    host.id = CONTAINER_ID;

    // Host styles (fixed overlay)
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.left = "0";
    host.style.width = "100vw"; // Use vw/pro to ensure full coverage
    host.style.height = "100vh";
    host.style.pointerEvents = "none"; // Passthrough
    host.style.zIndex = "2147483647";

    document.body.appendChild(host);

    // Create Shadow Root for style isolation
    const shadow = host.attachShadow({ mode: "open" });

    // Inject CSS
    // We assume finalform-loader.css is in the same directory as this script
    const scriptUrl =
      (document.currentScript as HTMLScriptElement)?.src ||
      document
        .querySelector('script[src*="finalform-global.js"]')
        ?.getAttribute("src");

    if (scriptUrl) {
      const cssUrl = scriptUrl
        .replace("finalform-global", "finalform-loader")
        .replace(".js", ".css");
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssUrl;
      shadow.appendChild(link);
    }

    // Portal Target
    const portalRoot = document.createElement("div");
    portalRoot.id = "finalform-portal-root";
    portalRoot.style.width = "100%";
    portalRoot.style.height = "100%";
    // portalRoot.style.pointerEvents = 'none'; // Inherited

    shadow.appendChild(portalRoot);

    console.log("[FinalForm] Global overlay container (Shadow) initialized");

    // Store reference
    (window as any).FinalFormGlobal = {
      ready: true,
      containerId: CONTAINER_ID,
      root: portalRoot, // React components should append here
    };
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureContainer);
  } else {
    ensureContainer();
  }
})();
