// app.js
// This is where everything starts. For now it just starts the router,
// later I'll register the service worker here too.

import { startRouter } from "./router.js";

/**
 * Starts the app (runs once when the page opens).
 */
function init() {
  startRouter();

  // just so I can see in the console (F12) that it actually runs
  console.log("Parking Saver started");
}

// modules run after the HTML is ready, so no need to wait for any load event
init();
