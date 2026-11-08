// db.js
// Everything about saving data lives here.
// I use IndexedDB, it's a small database built into the browser.
// It works without internet and can also store pictures (Blobs),
// which I need later for the parking spot photos.
//
// The annoying part: IndexedDB is old and works with events (onsuccess, onerror)
// instead of promises. So I wrap it in promises once here, and the rest of the
// app can just use async/await.

const DB_NAME = "parking-saver";
const DB_VERSION = 1; // bump this if I ever change the structure
const STORE = "spots"; // like a "table" in a normal database

// I keep the open connection here so I don't open the database every time
let dbPromise = null;

/**
 * Turns an IndexedDB request into a promise,
 * so I can write `await` instead of onsuccess/onerror.
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Opens the database (only the first time, after that it reuses it).
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // this only runs the very first time (or when DB_VERSION goes up).
    // it's the only place where I'm allowed to create stores
    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE)) {
        // every spot gets a number (id) automatically: 1, 2, 3...
        const store = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        // index so I can sort spots by the time they were saved
        store.createIndex("savedAt", "savedAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Small helper: opens the store for one operation.
 * "readonly" for reading, "readwrite" when I change something.
 * @param {'readonly'|'readwrite'} mode
 * @returns {Promise<IDBObjectStore>}
 */
async function getStore(mode) {
  const db = await openDB();
  return db.transaction(STORE, mode).objectStore(STORE);
}

/**
 * Saves a new parking spot.
 * A spot looks like this:
 * { lat, lng, accuracy, savedAt, note, photo, endTime, active }
 * @param {object} spot
 * @returns {Promise<number>} the id the database gave it
 */
export async function saveSpot(spot) {
  const store = await getStore("readwrite");
  return promisify(store.add(spot));
}

/**
 * Gets one spot by its id.
 * @param {number} id
 * @returns {Promise<object|undefined>} undefined if there's no such spot
 */
export async function getSpot(id) {
  const store = await getStore("readonly");
  return promisify(store.get(id));
}

/**
 * Gets all spots, newest first (that's how I want them in History).
 * @returns {Promise<object[]>}
 */
export async function getAllSpots() {
  const store = await getStore("readonly");
  // the savedAt index gives them oldest first, so I flip the list
  const spots = await promisify(store.index("savedAt").getAll());
  return spots.reverse();
}

/**
 * Gets the spot where the car is parked right now
 * (the newest one that's still active), or null if there isn't one.
 * @returns {Promise<object|null>}
 */
export async function getActiveSpot() {
  const spots = await getAllSpots();
  return spots.find((spot) => spot.active) || null;
}

/**
 * Saves changes to a spot that already exists (it needs to have an id).
 * put() overwrites the old version with the same id.
 * @param {object} spot
 * @returns {Promise<number>}
 */
export async function updateSpot(spot) {
  const store = await getStore("readwrite");
  return promisify(store.put(spot));
}

/**
 * Deletes one spot.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteSpot(id) {
  const store = await getStore("readwrite");
  return promisify(store.delete(id));
}
