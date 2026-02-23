self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  console.log('Nuking old manual PWA worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      self.registration.unregister();
    })
  );
});
