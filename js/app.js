// app.js
// This is where everything starts. It opens the database and starts the router,
// later I'll register the service worker here too.

import { startRouter } from "./router.js";
import { openDB } from "./db.js";

/**
 * Starts the app (runs once when the page opens).
 */
async function init() {
  // open the database first so it's ready when a screen needs it.
  // if it fails (very old browser, or private mode in some browsers)
  // the app still opens, saving just won't work
  try {
    await openDB();
  } catch (error) {
    console.error("Could not open the database", error);
  }

  startRouter();

  // just so I can see in the console (F12) that it actually runs
  console.log("Parking Saver started");
}

// modules run after the HTML is ready, so no need to wait for any load event
init();
