const btn = document.getElementById('toggle-btn');

function updateButton() {
  chrome.storage.local.get('enabled', ({ enabled }) => {
    btn.textContent = enabled ? 'Turn OFF' : 'Turn ON';
    btn.classList.toggle('off', !enabled);
  });
}

btn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'toggleAdBlocker' }, response => {
    updateButton();
  });
});

// Initialize button state
updateButton();
