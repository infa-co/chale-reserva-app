
const CACHE_NAME = 'ordomo-v2';
const STATIC_CACHE = 'ordomo-static-v2';

// Static assets to cache (excluding root to prevent navigation caching)
const urlsToCache = [
  '/manifest.json',
  '/lovable-uploads/8e9102a6-6888-4805-8ebf-893a0a3ad83e.png'
];

// Install event - cache essential assets and take control immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active one
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches and take control of all clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event with improved caching strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Different strategies for different types of requests
  if (request.mode === 'navigate') {
    // Navigation requests - always try network first
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for navigation
          return caches.match(request);
        })
    );
  } else if (url.pathname.includes('/src/') || url.pathname.includes('.js') || url.pathname.includes('.css') || url.pathname.includes('.tsx')) {
    // App assets - stale-while-revalidate for fast loading with updates
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            // Update cache with new version
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });

          // Return cached version immediately if available, otherwise wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else if (urlsToCache.includes(url.pathname)) {
    // Static assets - cache first with network fallback
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        });
      })
    );
  } else {
    // Everything else - network first
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
  }
});
