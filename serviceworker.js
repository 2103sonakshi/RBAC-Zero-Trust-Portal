const CACHE_NAME = "rbac-portal-v5";
const urlsToCache = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/vite.svg",
];

// Assets to cache - only static files that exist
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/vite.svg",
];

self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching static assets");
        // Cache each URL individually to handle failures gracefully
        return Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch((error) => {
              console.warn(`⚠️ Failed to cache ${url}:`, error);
            }),
          ),
        );
      })
      .then(() => {
        console.log("✅ Service Worker installed successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker installation failed:", error);
      }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Skip API calls - never cache them
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip Vite HMR and development assets
  if (
    url.pathname.includes("/@vite/") ||
    url.pathname.includes("/@react-refresh") ||
    url.pathname.includes("/node_modules/") ||
    (url.hostname === "localhost" && url.port === "5173")
  ) {
    return;
  }

  // Skip WebSocket connections
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response (only for static assets, not API calls)
          if (
            url.pathname.match(
              /\.(js|css|html|png|jpg|jpeg|gif|svg|ico|json|webmanifest)$/,
            ) ||
            url.pathname === "/" ||
            url.pathname === "/index.html"
          ) {
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache).catch((error) => {
                  console.warn(`⚠️ Failed to cache ${url.pathname}:`, error);
                });
              })
              .catch((error) => {
                console.warn(
                  `⚠️ Failed to open cache for ${url.pathname}:`,
                  error,
                );
              });
          }

          return response;
        })
        .catch((error) => {
          console.warn(`⚠️ Fetch failed for ${url.pathname}:`, error);

          // Return offline page for HTML requests
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/offline.html");
          }

          // Return a simple error response for other requests
          return new Response("Network error", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
    }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("✅ Service Worker activated successfully");
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("❌ Service Worker activation failed:", error);
      }),
  );
});

// Handle service worker errors
self.addEventListener("error", (event) => {
  console.error("❌ Service Worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Service Worker unhandled rejection:", event.reason);
});
