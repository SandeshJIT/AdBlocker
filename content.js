(async () => {
  const { enabled } = await chrome.storage.local.get("enabled");
  if (!enabled) return;

  const adSelectors = [
    'iframe[src*="ads"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="adservice"]',
    'iframe[src*="adserver"]',
    'iframe[src*="ad-delivery"]',
    '[id^="ad-"]',
    '[id*="_ad"]',
    '[class*="ad-"]',
    '[class*="ads"]',
    '[class*="sponsor"]',
    '[class*="sponsored"]',
    '[class*="promoted"]',
    '[class*="banner"]',
    '[id*="google_ads"]',
    '[class*="adsbygoogle"]',
    '[data-ad]',
    '[data-testid*="placementTracking"]',
    '[aria-label*="ad"]',
    '[aria-label*="sponsored"]',
    '[class*="advertisement"]',
    '[data-google-query-id]',
    '[id*="sponsored"]',
    '[href*="doubleclick.net"]'
  ];

  const adKeywords = /sponsored|advertisement|promoted|ad\s?choice/i;

  function removeElement(el) {
    if (el && el.parentNode) {
      el.remove();
    }
  }

  function checkNode(node) {
    if (node.nodeType !== 1) return;

    if (adSelectors.some(selector => node.matches(selector)) || adKeywords.test(node.innerText)) {
      removeElement(node);
      return;
    }

    node.querySelectorAll(adSelectors.join(',')).forEach(removeElement);

    if (node.shadowRoot) {
      checkDOM(node.shadowRoot);
    }
  }

  function checkDOM(root = document) {
    root.querySelectorAll(adSelectors.join(',')).forEach(removeElement);

    root.querySelectorAll('div, section, span, aside, article').forEach(node => {
      if (adKeywords.test(node.innerText)) {
        removeElement(node);
      }
    });

    root.querySelectorAll('*').forEach(node => {
      if (node.shadowRoot) {
        checkDOM(node.shadowRoot);
      }
    });
  }

  checkDOM();

  const observer = new MutationObserver(mutations => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach(checkNode);
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  setInterval(() => checkDOM(), 3000);
})();
