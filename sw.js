// sw.js - Service Worker for Homies Chat

const CACHE_NAME = 'homies-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js',
  'https://cdn.jsdelivr.net/npm/emoji-picker-element@1.18.3/index.browser.js'
];

// Install: Cache the core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// Fetch: Network-first strategy for the main page, Cache-first for assets
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // If it's a Firebase or CDN asset, try cache first, then network
  if (url.hostname.includes('firebase') || url.hostname.includes('gstatic') || url.hostname.includes('cdn.jsdelivr')) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
    return;
  }

  // For everything else (like the main HTML), try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Clone the response to cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            if (request.url.includes('/') && !request.url.includes('?')) {
              cache.put(request, responseToCache);
            }
          });
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(request);
      })
  );
});