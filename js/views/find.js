// views/find.js
// Screen 2 - shows where your car is (arrow + distance).
// Just placeholders for now, the real distance and compass come later.

import { navigate } from "../router.js";

/**
 * Draws the Find My Car screen.
 * @param {HTMLElement} container - the <main> element
 */
export function render(container) {
  container.innerHTML = `
    <section class="card center">
      <h2>Find my car</h2>

      <!-- this arrow will turn toward the car once the compass works -->
      <div class="compass" aria-hidden="true">⬆️</div>

      <p class="distance">— m</p>
      <p class="muted">Follow the arrow to get back to your car.</p>

      <button id="found-btn" class="btn btn-secondary" type="button">
        ✅ I found my car
      </button>
    </section>
  `;

  // TODO: move the spot into history. for now it just opens History
  container.querySelector("#found-btn").addEventListener("click", () => {
    navigate("/history");
  });
}
