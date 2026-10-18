# Parking Saver

Have you ever walked out of a shopping mall and had no idea where you left your car? That happens to me way too often, so for this project I built **Parking Saver**, a small Progressive Web App that remembers where you parked.

You tap one button and the app saves your location together with a photo of the spot. Later, an arrow on the screen points you back to your car, like a compass. You can also set how long you paid for parking, and the app will remind you before the time runs out so you don't get a ticket.

**Try it here:** https://olezhakashz.github.io/parking-saver-pwa/ (works once GitHub Pages is on)

---

## What the app can do

- Save your parking spot with one tap (GPS location and time)
- Take a photo of the spot, which is really useful in big garages ("Level -2, pillar B14")
- Add a short note
- Set a parking timer and get a notification 10 minutes before it ends
- Follow a compass arrow back to your car and see how many meters are left
- See you and your car on a map
- Look through the history of places where you parked before
- Install it on your phone like a normal app
- Use it without internet, because everything you saved is still there

## How the app is organized

I kept it to three screens, and each one has one job. You switch between them with the bar at the bottom.

1. **Save Spot**: this is where you start. You press "Save my spot", take a photo, write a note if you want and set the parking time.
2. **Find My Car**: right after saving, the app takes you here. The big arrow shows the direction to your car and the number under it shows the distance. There is also a small map. When you reach the car, you press "I found my car".
3. **History**: all your old parking spots with the photo and the date. You can open one or delete it.

So the flow is simple: **save → find → history**. Every screen has its own address (`#/save`, `#/find`, `#/history`), so the phone's back button works the way you would expect.

## Native features I used

This was the most interesting part for me, because the app talks directly to the phone's hardware.

**GPS (Geolocation API).**
When you save a spot I call `navigator.geolocation.getCurrentPosition()` to get the exact coordinates. On the Find My Car screen I use `watchPosition()` instead, which keeps sending me your new position while you walk. To get the distance between you and the car I used the Haversine formula, and for the direction I used the bearing formula. Both are in `js/geo.js`.

**Camera (getUserMedia).**
GPS is often bad inside parking garages, so a photo really helps. I open the back camera with `getUserMedia({ video: { facingMode: 'environment' } })`, show it in a `<video>` element, and when you press the button I copy the current frame onto a `<canvas>` and save it as a small JPEG. If the camera doesn't work for some reason, the app falls back to a normal file picker that can also open the camera. The code is in `js/camera.js`.

**Compass (Device Orientation API).**
The phone tells me which way it is facing (the heading). I already know the direction from you to the car (the bearing), so the arrow just rotates by `bearing - heading`. I apply that angle with a CSS `rotate()`. iPhones are a bit special here, because they ask for permission first, so there is an "Enable compass" button for them. See `js/compass.js`.

**Notifications.**
When you set a parking time, the app asks if it can send notifications. Ten minutes before the time ends, the Service Worker shows a reminder. If you tap it, the Find My Car screen opens. The code is in `js/notify.js` and `sw.js`.

As a small extra, the phone also vibrates when a spot is saved (`navigator.vibrate`).

## Offline mode

I wanted the app to work in places like underground garages, where there is usually no signal at all.

- The **Service Worker** saves all the app files the first time you open it, so the app opens even without internet.
- Your spots, photos and notes are saved in **IndexedDB**, which is a small database inside the browser, so they never need the internet.
- When you lose connection, a yellow bar shows up at the top: _"You're offline. Saving spots, the compass and your history still work. The map will update when you're back online."_

GPS, the camera and the compass don't need internet anyway, so almost everything works offline. The only thing that needs a connection is loading new parts of the map. Parts you have already seen are cached, so they still show up.

## Caching strategy (and why)

I didn't use one strategy for everything, because different files change in different ways.

**App files (HTML, CSS, JS, icons, manifest): cache first.**
The app needs these to even start, and they only change when I release a new version. Taking them straight from the cache makes the app open instantly, even offline. When I update the app, I change `CACHE_VERSION` in `sw.js`, and the old cache is deleted.

**Map tiles: stale-while-revalidate.**
Map pictures almost never change. So I show the cached tile right away and quietly download a fresh one in the background for next time. I also keep at most 200 tiles so the cache doesn't eat the phone's storage.

**Leaflet library (from the CDN): cache first.**
The link has a fixed version number in it (1.9.4), so the file will never change. There is no reason to download it again.

**Anything else: network first, then cache.**
If you're online, you get the newest version. If you're offline, you get the last saved copy.

**Your spots and photos: IndexedDB, not the cache.**
This is your personal data, not files from the internet. IndexedDB is better for this because it can store objects and images and search through them.

## Technologies

- HTML, CSS and plain JavaScript (no framework and no build tools)
- Service Worker and Cache API
- IndexedDB
- Web App Manifest
- Geolocation, Camera, Device Orientation, Notifications and Vibration APIs
- Leaflet and OpenStreetMap for the map
- GitHub Pages for hosting (it gives HTTPS for free)

## Dependencies

The only outside library is **[Leaflet](https://leafletjs.com/) 1.9.4**, which is loaded from a CDN, so you don't have to install anything. The map images come from **OpenStreetMap**.

## How to run it

One important thing: the camera, GPS and Service Workers only work on **HTTPS** or on **localhost**. If you just double-click `index.html`, they won't work.

1. Download the project:
   ```bash
   git clone https://github.com/olezhakashz/parking-saver-pwa.git
   cd parking-saver-pwa
   ```
2. Start a simple local server. Any of these works:
   ```bash
   python3 -m http.server 8080
   ```
   or
   ```bash
   npx serve .
   ```
   You can also just right-click `index.html` in VS Code and choose **Open with Live Server**.
3. Open http://localhost:8080 in Chrome.

To test offline mode, open DevTools (F12), go to **Application → Service Workers** and tick **Offline**.

The compass and the camera are best tested on a real phone. You can just open the GitHub Pages link on your phone. On a computer you can fake the location and the compass in DevTools under **More tools → Sensors**.

## How I deployed it

The app runs on GitHub Pages:

1. Push the code to the `main` branch.
2. On GitHub, go to **Settings → Pages**.
3. Choose **Deploy from a branch**, then `main` and `/ (root)`, and save.
4. After a minute it's online at https://olezhakashz.github.io/parking-saver-pwa/

## Project structure

```
parking-saver-pwa/
├── index.html         main page with the header, offline bar and bottom menu
├── manifest.json      app name, icons and colors, so it can be installed
├── sw.js              Service Worker (caching and notifications)
├── css/
│   └── style.css      all styles, mobile first
├── js/
│   ├── app.js         starts everything
│   ├── router.js      switches between the 3 screens
│   ├── db.js          saving and reading data in IndexedDB
│   ├── geo.js         GPS, distance and direction
│   ├── camera.js      taking the photo
│   ├── compass.js     rotating the arrow
│   ├── notify.js      parking reminder
│   └── views/
│       ├── save.js    Save Spot screen
│       ├── find.js    Find My Car screen
│       └── history.js History screen
└── icons/             app icons
```

I tried to keep every file small and focused on one thing, and I added comments to the code so it's easy to follow.

## Performance

I wanted the app to feel fast, so:

- no frameworks, just plain JS
- scripts load as modules, so they don't block the page
- photos are made smaller before saving (max 1280 px, JPEG)
- images in History load only when you scroll to them
- the map library loads only when a map is actually on the screen
- after the first visit, everything opens from the cache

My goal was 90+ in every Lighthouse category. You can check it yourself in Chrome DevTools → **Lighthouse**.

## Things to know

- **iPhone:** to install the app, open it in Safari and use **Share → Add to Home Screen**. Notifications on iPhone only work after the app is installed like this.
- **Reminder:** if the phone completely closes the app, the reminder might not show up. Doing that reliably would need a push server, which is outside the scope of this project.
- **Compass:** it needs a phone with a compass sensor. On a laptop you will just see the distance and the map.
- **Underground garages:** GPS can be inaccurate there, and that's exactly why the app saves a photo and a note too.

---

Made by Oleh for the course _Development of Progressive Mobile Applications_.
