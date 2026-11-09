const CACHE = "challenge-v1";
const FILES = ["/", "/index.html", "/manifest.json", "/icon-192.jpg", "/icon-512.jpg"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (!response.ok || new URL(event.request.url).origin !== self.location.origin) return response;
      return caches.open(CACHE)
        .then(cache => cache.put(event.request, response.clone()).then(() => response))
        .catch(error => {
          console.error("Échec de la mise en cache :", error);
          return response;
        });
    }).catch(async error => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        const appShell = await caches.match("/index.html");
        if (appShell) return appShell;
      }
      console.error("Ressource indisponible hors connexion :", event.request.url, error);
      return new Response("Ressource indisponible hors connexion.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    })
  );
});