// views/save.js
// Screen 1 - where you save your parking spot.
// One tap gets the GPS position (geo.js), you can add a photo (camera.js)
// and a short note, and it all goes into the database (db.js).

import { navigate } from "../router.js";
import { getCurrentPosition, geoErrorMessage } from "../geo.js";
import {
  isCameraSupported,
  startCamera,
  stopCamera,
  capturePhoto,
  shrinkImageFile,
} from "../camera.js";
import { saveSpot, getActiveSpot, updateSpot } from "../db.js";

// things I need to remember while this screen is open
let stream = null; // the live camera, so I can turn it off
let photo = null; // the photo Blob once it's taken
let previewUrl = null; // temporary link to show the photo in an <img>

/**
 * Draws the Save Spot screen.
 * If the car is already parked somewhere, it shows that spot first.
 * @param {HTMLElement} container - the <main> element
 */
export async function render(container) {
  resetState();
  container.innerHTML = `<section class="card"><p class="muted">Loading…</p></section>`;

  // when you leave this screen, turn off the camera and free the photo memory
  window.addEventListener("hashchange", resetState, { once: true });

  const active = await getActiveSpot();

  // reading the database takes a moment. if you already switched to
  // another screen in that time, I must not draw over it
  if (window.location.hash !== "#/save") return;

  const card = container.querySelector(".card");
  if (active) {
    showActiveSpot(card, active);
  } else {
    showForm(card);
  }
}

/**
 * Turns off the camera and forgets the photo.
 */
function resetState() {
  stopCamera(stream);
  stream = null;
  photo = null;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
}

/**
 * Shown when the car is already saved: you can go find it,
 * or save a new spot if you parked somewhere else.
 * @param {HTMLElement} card
 * @param {object} spot
 */
function showActiveSpot(card, spot) {
  const time = new Date(spot.savedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // the photo is a Blob, so I make a temporary link to it for the <img>
  if (spot.photo) previewUrl = URL.createObjectURL(spot.photo);

  card.innerHTML = `
    <h2>Your car is saved 🚗</h2>
    <p class="muted">Saved at ${time}</p>
    ${previewUrl ? `<img class="photo-preview" src="${previewUrl}" alt="Photo of the parking spot">` : ""}
    <p class="spot-note"></p>
    <button id="find-btn" class="btn btn-primary btn-big" type="button">🧭 Find my car</button>
    <button id="new-btn" class="btn btn-secondary btn-big" type="button">I parked somewhere else</button>
  `;

  // textContent instead of innerHTML for the note, so if someone types
  // something like <script> it just shows as text and can't run
  card.querySelector(".spot-note").textContent = spot.note || "";

  card
    .querySelector("#find-btn")
    .addEventListener("click", () => navigate("/find"));
  card.querySelector("#new-btn").addEventListener("click", () => {
    resetState();
    showForm(card);
  });
}

/**
 * The normal form: photo (optional), note (optional) and the big save button.
 * @param {HTMLElement} card
 */
function showForm(card) {
  card.innerHTML = `
    <h2>Where did you park?</h2>
    <p class="muted">Tap the button when you leave your car.
       The app will remember the place for you.</p>

    <div id="photo-area" class="photo-area"></div>

    <label class="field-label" for="note">Note (optional)</label>
    <input id="note" class="text-input" type="text" maxlength="80"
           placeholder="e.g. Level -2, spot B14" autocomplete="off">

    <!-- aria-live makes screen readers read out the messages when they change -->
    <p id="save-status" class="status" role="status" aria-live="polite"></p>

    <button id="save-btn" class="btn btn-primary btn-big" type="button">
      📍 Save my spot
    </button>

    <!-- backup for the camera: hidden file input. capture="environment"
         tells phones to open the back camera straight away -->
    <input id="file-input" type="file" accept="image/*" capture="environment" hidden>
  `;

  showPhotoEmpty(card);

  // backup way: a photo picked with the file input
  card
    .querySelector("#file-input")
    .addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        setPhoto(card, await shrinkImageFile(file));
      } catch (error) {
        setStatus(card, "Couldn't read that photo, try another one.", true);
      }
    });

  card
    .querySelector("#save-btn")
    .addEventListener("click", () => handleSave(card));
}

/**
 * Photo area, step 1: no photo yet, just the button.
 * @param {HTMLElement} card
 */
function showPhotoEmpty(card) {
  const area = card.querySelector("#photo-area");
  area.innerHTML = `
    <button id="photo-btn" class="btn btn-secondary photo-btn" type="button">
      📷 Add a photo (optional)
    </button>
  `;

  area.querySelector("#photo-btn").addEventListener("click", () => {
    if (isCameraSupported()) {
      showPhotoCamera(card);
    } else {
      card.querySelector("#file-input").click(); // opens the phone's camera/gallery
    }
  });
}

/**
 * Photo area, step 2: the live camera with a "take photo" button.
 * @param {HTMLElement} card
 */
async function showPhotoCamera(card) {
  const area = card.querySelector("#photo-area");
  area.innerHTML = `
    <div class="camera-box">
      <!-- playsinline is needed on iPhone, otherwise the video goes fullscreen -->
      <video id="camera-video" playsinline muted></video>
    </div>
    <div class="btn-row">
      <button id="shoot-btn" class="btn btn-primary" type="button">📸 Take photo</button>
      <button id="cancel-btn" class="btn btn-secondary" type="button">Cancel</button>
    </div>
  `;

  const video = area.querySelector("#camera-video");

  area.querySelector("#cancel-btn").addEventListener("click", () => {
    stopCamera(stream);
    stream = null;
    showPhotoEmpty(card);
  });

  area.querySelector("#shoot-btn").addEventListener("click", async () => {
    const blob = await capturePhoto(video);
    stopCamera(stream); // got the photo, camera can go off
    stream = null;
    setPhoto(card, blob);
  });

  try {
    stream = await startCamera(video);
  } catch (error) {
    // no permission or no camera: fall back to the file input
    console.warn("Camera did not start, using the file input instead", error);
    showPhotoEmpty(card);
    card.querySelector("#file-input").click();
  }
}

/**
 * Photo area, step 3: shows the photo with a "retake" button.
 * @param {HTMLElement} card
 * @param {Blob} blob
 */
function setPhoto(card, blob) {
  photo = blob;
  if (previewUrl) URL.revokeObjectURL(previewUrl); // free the old one
  previewUrl = URL.createObjectURL(blob);

  const area = card.querySelector("#photo-area");
  area.innerHTML = `
    <img class="photo-preview" src="${previewUrl}" alt="Photo of the parking spot">
    <button id="retake-btn" class="btn btn-secondary" type="button">🔄 Retake</button>
  `;
  area.querySelector("#retake-btn").addEventListener("click", () => {
    photo = null;
    showPhotoEmpty(card);
  });
}

/**
 * Shows a short message under the form (normal or red for errors).
 * @param {HTMLElement} card
 * @param {string} text
 * @param {boolean} [isError]
 */
function setStatus(card, text, isError = false) {
  const status = card.querySelector("#save-status");
  status.textContent = text;
  status.classList.toggle("status-error", isError);
}

/**
 * What happens when you tap "Save my spot":
 * get GPS -> put everything together -> save it -> go to Find My Car.
 * @param {HTMLElement} card
 */
async function handleSave(card) {
  const saveBtn = card.querySelector("#save-btn");
  saveBtn.disabled = true; // so you can't tap it twice and save 2 spots
  setStatus(card, "📡 Finding your location…");

  let position;
  try {
    position = await getCurrentPosition();
  } catch (error) {
    setStatus(card, geoErrorMessage(error), true);
    saveBtn.disabled = false;
    return;
  }

  const spot = {
    lat: position.lat,
    lng: position.lng,
    accuracy: position.accuracy,
    savedAt: Date.now(),
    note: card.querySelector("#note").value.trim(),
    photo, // the Blob, or null if you skipped the photo
    endTime: null, // parking timer comes later
    active: true,
  };

  try {
    // only one car can be parked at a time, so the old spot
    // stops being "active" and just stays in History
    const oldSpot = await getActiveSpot();
    if (oldSpot) {
      oldSpot.active = false;
      await updateSpot(oldSpot);
    }

    await saveSpot(spot);
  } catch (error) {
    console.error(error);
    setStatus(
      card,
      "Couldn't save the spot on this device. Please try again.",
      true,
    );
    saveBtn.disabled = false;
    return;
  }

  // short buzz so you feel it worked (Vibration API, phones only).
  // the ?. means "only call it if it exists", iPhones don't have it
  navigator.vibrate?.(100);

  navigate("/find");
}
