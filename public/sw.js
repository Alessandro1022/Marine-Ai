const CACHE_NAME = "marivio-v1";
const urlsToCache = ["/", "/manifest.json"];
const TILE_URLS = ["tiles.emodnet", "basemaps.cartocdn", "tiles.openseamap", "ows.emodnet"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((cn) => cn !== CACHE_NAME && caches.delete(cn)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isTile = TILE_URLS.some((t) => url.hostname.includes(t));
  if (isTile) {
    event.respondWith(
      fetch(event.request)
        .then((res) => (res && res.status === 200 ? res : caches.match(event.request) || res))
        .catch(() => caches.match(event.request) || new Response("Offline"))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((r) => r || fetch(event.request)).catch(() => caches.match("/"))
    );
  }
});
