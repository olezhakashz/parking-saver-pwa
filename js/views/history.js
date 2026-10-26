// views/history.js
// Screen 3 - list of your old parking spots.
// Empty for now, i will load from database later

/**
 * Draws the History screen.
 * @param {HTMLElement} container - the <main> element
 */
export function render(container) {
  container.innerHTML = `
    <section class="card center">
      <h2>History</h2>
      <div class="empty-icon" aria-hidden="true">🅿️</div>
      <p class="muted">No parking spots yet.</p>
      <!-- normal link, the router catches the # change so no JS needed -->
      <a href="#/save" class="btn btn-primary">Save your first spot</a>
    </section>
  `;
}
