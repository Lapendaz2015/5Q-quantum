const VERSION = '2025-10-01';

self.addEventListener('install', (event) => {
  // Activate immediately, skip waiting so new versions take effect
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Clear all caches to avoid stale assets
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
    // Take control of uncontrolled clients right away
    await self.clients.claim();
    // Notify pages to reload if needed
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.postMessage({ type: 'NEW_SW_ACTIVATED', version: VERSION }));
  })());
});

self.addEventListener('fetch', (event) => {
  // Force revalidation against the network so updated assets are picked up
  event.respondWith(fetch(event.request, { cache: 'reload' }));
});
