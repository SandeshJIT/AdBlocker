chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
  chrome.action.setIcon({ path: "icon.png" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleAdBlocker") {
    chrome.storage.local.get("enabled", ({ enabled }) => {
      const newState = !enabled;
      chrome.storage.local.set({ enabled: newState });
      
      chrome.action.setIcon({
        path: newState ? "icon.png" : "icon-open.svg"
      });

      sendResponse({ enabled: newState });

      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => chrome.tabs.reload(tab.id));
      });
    });
    return true; 
  }
});
