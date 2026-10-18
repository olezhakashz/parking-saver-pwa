/**
 * app.js – the entry point of Parking Saver.
 *
 * The browser runs this file first (see the <script> tag in index.html).
 * Its job is to start the app. Right now it only shows a welcome screen;
 * in the next weeks it will also start the router (week 2),
 * register the Service Worker (week 11) and more.
 */

/**
 * Draws the welcome message inside the <main id="app"> element.
 * @param {HTMLElement} container - the element where the content goes
 */
function showWelcome(container) {
  // innerHTML replaces everything inside the element with this HTML.
  // The backticks (`) let us write HTML on several lines.
  container.innerHTML = `
    <section class="card">
      <h2>Welcome to Parking Saver 👋</h2>
      <p>Never forget where you parked again.</p>
      <p>Soon you will be able to save your spot, take a photo of it
         and follow a compass arrow back to your car.</p>
    </section>
  `;
}

/**
 * Starts the app. Called once when the page has loaded.
 */
function init() {
  // Find the main area of the page by its id
  const app = document.getElementById("app");
  showWelcome(app);

  // A message in the browser console (F12) so we can see the script works
  console.log("Parking Saver started");
}

// Modules run after the HTML is parsed, so all elements already exist
// and we can start the app straight away.
init();
