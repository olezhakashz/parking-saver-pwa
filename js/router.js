// router.js
// Switches between the 3 screens.
//
// Every screen has its own address after the #, like #/find.
// Changing the part after # doesn't reload the page, the browser only
// fires a "hashchange" event. So I listen for that and draw the right screen.

import { render as renderSave } from "./views/save.js";
import { render as renderFind } from "./views/find.js";
import { render as renderHistory } from "./views/history.js";

// all screens in one place. adding a new one is just one more line here
const routes = {
  "/save": { title: "Save Spot", render: renderSave },
  "/find": { title: "Find My Car", render: renderFind },
  "/history": { title: "History", render: renderHistory },
};

// where to go if the address is empty or something random
const DEFAULT_ROUTE = "/save";

/**
 * Gets the current screen path from the URL, e.g. "#/find" -> "/find".
 * @returns {string}
 */
function getCurrentPath() {
  return window.location.hash.slice(1); // cut off the "#"
}

/**
 * Makes the menu button of the current screen blue.
 * @param {string} path - like "/find"
 */
function highlightNavLink(path) {
  const links = document.querySelectorAll(".nav-link");

  links.forEach((link) => {
    const isActive = link.getAttribute("href") === "#" + path;

    // adds "active" if true, removes it if false
    link.classList.toggle("active", isActive);

    // for screen readers, so they know which page is open
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

/**
 * Draws whatever screen matches the current address.
 * Runs on start and every time the # part changes.
 */
function handleRouteChange() {
  const path = getCurrentPath();
  const route = routes[path];

  // unknown address -> send to the default screen.
  // replace() so the wrong address doesn't stay in the back-button history.
  // this changes the hash again, so this function gets called again by itself
  if (!route) {
    window.location.replace("#" + DEFAULT_ROUTE);
    return;
  }

  const container = document.getElementById("app");

  // restart the fade-in animation. if I just add the class again it won't
  // replay, so I remove it, make the browser recalculate (offsetWidth),
  // and add it back
  container.classList.remove("view-enter");
  void container.offsetWidth;
  container.classList.add("view-enter");

  route.render(container);
  document.title = `${route.title} · Parking Saver`;

  highlightNavLink(path);

  // new screen should start from the top
  window.scrollTo(0, 0);
}

/**
 * Turns the router on and shows the first screen.
 */
export function startRouter() {
  window.addEventListener("hashchange", handleRouteChange);
  handleRouteChange();
}

/**
 * Go to another screen from code, e.g. after a button click.
 * @param {string} path - like "/find"
 */
export function navigate(path) {
  window.location.hash = path; // hashchange does the rest
}
