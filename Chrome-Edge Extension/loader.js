// loader.js
// Compatible with Chrome, Edge, and Firefox

// Detect the browser API (Chrome uses 'chrome', Firefox uses 'browser')
const browserAPI = (typeof chrome !== "undefined") ? chrome : browser;

const script = document.createElement('script');
script.src = browserAPI.runtime.getURL('main.js');

script.onload = function() {
    this.remove(); // Clean up the tag after injection
};

(document.head || document.documentElement).appendChild(script);