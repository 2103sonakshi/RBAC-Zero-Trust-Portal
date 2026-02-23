self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated - clearing old caches');
  // Clear all caches unconditionally every time
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// A standard fetch handler that bypasses cache so we don't get stuck, 
// but is REQUIRED by Google Chrome for the PWA Install prompt to ever appear.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      // If network fails, return a 503 so frontend Axios can catch it and go offline
      return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
    })
  );
});
