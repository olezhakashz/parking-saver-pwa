// camera.js
// Taking the photo of the parking spot.
// Main way: open the back camera live inside the app (getUserMedia).
// Backup way: if that doesn't work, use a normal file input that can also
// open the camera app. Either way I end up with a small JPEG Blob.

// photos from phones are huge (like 4000px), I don't need that for a parking spot
const MAX_SIZE = 1280; // longest side in pixels
const JPEG_QUALITY = 0.7; // 0 to 1, 0.7 still looks fine and is way smaller

/**
 * Checks if the browser can open the camera inside the page.
 * @returns {boolean}
 */
export function isCameraSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Turns on the camera and shows it in a <video> element.
 * The browser asks for permission the first time.
 * @param {HTMLVideoElement} video
 * @returns {Promise<MediaStream>} I need the stream later to turn the camera off
 */
export async function startCamera(video) {
  const stream = await navigator.mediaDevices.getUserMedia({
    // "environment" = the back camera. it's only a wish, so on a laptop
    // it just uses the normal webcam instead of failing
    video: { facingMode: "environment" },
    audio: false,
  });

  video.srcObject = stream;
  await video.play();
  return stream;
}

/**
 * Turns the camera off. If I forget this, the camera light stays on
 * and the phone keeps using battery.
 * @param {MediaStream|null} stream
 */
export function stopCamera(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Draws any image (or video frame) onto a canvas, scaled down,
 * and gives back a JPEG Blob.
 * @param {CanvasImageSource} source - a <video> or an ImageBitmap
 * @param {number} width - original width
 * @param {number} height - original height
 * @returns {Promise<Blob>}
 */
function toSmallJpeg(source, width, height) {
  // keep the same shape, just make the longest side at most MAX_SIZE
  const scale = Math.min(1, MAX_SIZE / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);

  // toBlob uses a callback, so again I wrap it in a promise
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not create the photo.")),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/**
 * Takes a picture of whatever the camera shows right now.
 * @param {HTMLVideoElement} video
 * @returns {Promise<Blob>}
 */
export function capturePhoto(video) {
  return toSmallJpeg(video, video.videoWidth, video.videoHeight);
}

/**
 * For the backup way: shrinks a photo picked with the file input.
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export async function shrinkImageFile(file) {
  const bitmap = await createImageBitmap(file);
  const blob = await toSmallJpeg(bitmap, bitmap.width, bitmap.height);
  bitmap.close(); // free the memory
  return blob;
}
