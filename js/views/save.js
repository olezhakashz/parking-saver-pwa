// views/save.js
// Screen 1 - where you save your parking spot.
// Only the layout for now, GPS and the camera come later.

import { navigate } from "../router.js";

/**
 * Draws the Save Spot screen.
 * @param {HTMLElement} container - the <main> element
 */
export function render(container) {
  container.innerHTML = `
    <section class="card">
      <h2>Where did you park?</h2>
      <p class="muted">Tap the button when you leave your car.
         The app will remember the place for you.</p>

      <button id="save-btn" class="btn btn-primary btn-big" type="button">
        📍 Save my spot
      </button>
    </section>
  `;

  // the button only exists after innerHTML, so I grab it here
  const saveBtn = container.querySelector("#save-btn");

  // TODO: actually save the location. for now it just goes to the next screen
  saveBtn.addEventListener("click", () => {
    navigate("/find");
  });
}
