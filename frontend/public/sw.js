const CACHE_NAME = "ug-rally-tracker-v1";
const urlsToCache = ["/", "/manifest.json", "/offline.html"];

// Install event - cache static assets
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - network first for API, cache first for assets
self.addEventListener("fetch", function (event) {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first strategy for API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(function () {
          // If network fails, try cache
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first strategy for other assets
  event.respondWith(
    caches.match(request).then(function (response) {
      return response || fetch(request);
    })
  );
});

// Push notification event
self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/badge.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});
