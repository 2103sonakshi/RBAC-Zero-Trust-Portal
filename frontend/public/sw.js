self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', async () => {
    console.log('Nuking old PWA worker...');
    const keys = await caches.keys();
    for (const key of keys) {
        await caches.delete(key);
    }
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.navigate(client.url));
});
