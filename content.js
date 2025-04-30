const adSelectors = [
    'iframe[src*="ads"]',
    'div[id^="ad-"]',
    'div[class*="ad-banner"]',
    'div[class*="ad-container"]',
    '[id*="google_ads"]',
    '[class*="adsbygoogle"]',
    '[class*="sponsored"]'
  ];
  
  function removeAds() {
    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (isProbablyAnAd(el)) el.remove();
      });
    });
  }
  
  function isProbablyAnAd(el) {
    const rect = el.getBoundingClientRect();
    return rect.width < 400 && rect.height < 300;
  }
  
  chrome.storage.sync.get([location.href], result => {
    if (result[location.href] !== false) {
      removeAds();
      const observer = new MutationObserver(removeAds);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
  