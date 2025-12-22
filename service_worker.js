const CACHE_NAME = "brick-buster-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/brick_0.svg",
  "/brick_1.svg",
  "/brick_2.svg",
  "/brick_3.svg",
  "/coin.svg",
  "/get_coin.mp3",
  "/brick_buster.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
