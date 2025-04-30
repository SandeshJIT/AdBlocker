(async () => {
  const { enabled } = await chrome.storage.local.get("enabled");
  if (!enabled) return;

  const API_URL = "https://raw.githubusercontent.com/SandeshJIT/adblocker-resource/main/adblockdomains.json";
  const CACHE_KEY = "cachedAdHosts";
  const CACHE_TIMESTAMP_KEY = "cachedAdHostsFetchedAt";
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // --- Load domain list from cache or fetch ---
  async function getAdHosts() {
    const storage = await chrome.storage.local.get([CACHE_KEY, CACHE_TIMESTAMP_KEY]);
    const now = Date.now();
    const isStale = !storage[CACHE_TIMESTAMP_KEY] || now - storage[CACHE_TIMESTAMP_KEY] > ONE_DAY_MS;

    if (isStale) {
      try {
        const res = await fetch(API_URL);
        if (res.ok) {
          const hosts = await res.json();
          await chrome.storage.local.set({
            [CACHE_KEY]: hosts,
            [CACHE_TIMESTAMP_KEY]: now
          });
          return hosts;
        }
      } catch (err) {
        console.warn("⚠️ Failed to fetch domain list:", err);
      }
    }

    return storage[CACHE_KEY] || []; // fallback
  }

  const adHosts = await getAdHosts();
  const safeDomains = ["youtube.com", "youtu.be", "vimeo.com", "twitch.tv"];
  const adKeywords = /sponsored|advertisement|promoted|ad\s?choice/i;

  // --- Heuristics ---
  function isAdIframe(iframe) {
    try {
      const url = new URL(iframe.src);
      const host = url.hostname;
      if (safeDomains.some(d => host.includes(d))) return false;
      return adHosts.some(adHost => host.includes(adHost));
    } catch {
      return false;
    }
  }

  function removeIfAdNode(node) {
    if (node.nodeType !== 1) return;

    // Remove ad iframe
    if (node.tagName === 'IFRAME' && isAdIframe(node)) {
      node.remove();
      return;
    }

    // Remove keyword-based ads
    if (adKeywords.test(node.innerText)) {
      node.remove();
      return;
    }

    // Recursively scan children
    node.querySelectorAll('iframe').forEach(iframe => {
      if (isAdIframe(iframe)) iframe.remove();
    });

    node.querySelectorAll('div, section, article, aside, span').forEach(el => {
      if (adKeywords.test(el.innerText)) el.remove();
    });

    if (node.shadowRoot) scanDOM(node.shadowRoot);
  }

  function scanDOM(root = document) {
    root.querySelectorAll('iframe').forEach(iframe => {
      if (isAdIframe(iframe)) iframe.remove();
    });

    root.querySelectorAll('div, section, article, aside, span').forEach(el => {
      if (adKeywords.test(el.innerText)) el.remove();
    });

    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) scanDOM(el.shadowRoot);
    });
  }

  // Initial scan
  scanDOM();

  // Observe for dynamic ads
  const observer = new MutationObserver(mutations => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach(removeIfAdNode);
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  setInterval(scanDOM, 3000);
})();
