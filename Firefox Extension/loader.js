// loader.js
// Injects the main logic into the "real" page world
const script = document.createElement('script');
script.src = browser.runtime.getURL('main.js');
script.onload = function() {
    this.remove(); // Clean up tag
};
(document.head || document.documentElement).appendChild(script);