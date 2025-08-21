const CACHE_NAME = 'speedstrokes-v4';
const STATIC_CACHE = 'speedstrokes-static-v4';
const DYNAMIC_CACHE = 'speedstrokes-dynamic-v4';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/browserconfig.xml'
];

const DYNAMIC_ASSETS = [
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/index.js',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/react-refresh.js',
  '/_next/static/css/app.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(DYNAMIC_CACHE).then((cache) => cache.addAll(DYNAMIC_ASSETS))
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests (for future use)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return offline response for API calls
        return new Response(JSON.stringify({ error: 'Offline mode' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // Handle dynamic assets and pages
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((fetchResponse) => {
        // Don't cache non-successful responses
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        // Clone the response
        const responseToCache = fetchResponse.clone();

        // Cache the response
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return fetchResponse;
      }).catch(() => {
        // Return offline page for navigation requests
        if (request.destination === 'document') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for future offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Future: Sync any offline data when connection is restored
  return Promise.resolve();
} 