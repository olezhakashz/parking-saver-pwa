// geo.js
// Everything about GPS lives here.
// For now it just gets your current position (week 5),
// later I'll add the distance and direction to the car here too.

/**
 * Asks the phone where we are right now.
 * The browser shows a "allow location?" popup the first time.
 * The original API uses callbacks, so I wrap it in a promise to use await.
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    // super old browsers don't have geolocation at all
    if (!("geolocation" in navigator)) {
      reject(new Error("Your browser does not support location."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // I only keep the 3 numbers I actually need
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy), // in meters
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true, // use real GPS, not just wifi. slower but way more exact
        timeout: 15000, // give up after 15 seconds (in garages it can take forever)
        maximumAge: 0, // don't give me an old cached position, I want where I am now
      },
    );
  });
}

/**
 * Turns a geolocation error into a sentence a normal person understands.
 * The error codes come from the Geolocation API: 1, 2 or 3.
 * @param {GeolocationPositionError|Error} error
 * @returns {string}
 */
export function geoErrorMessage(error) {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return "Location is blocked. Allow it in your browser settings to save your spot.";
    case 2: // POSITION_UNAVAILABLE
      return "Couldn't find your location. Try moving closer to the exit or a window.";
    case 3: // TIMEOUT
      return "Finding your location took too long. Please try again.";
    default:
      return error.message || "Something went wrong with the location.";
  }
}
