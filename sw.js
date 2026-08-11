// sw.js - Service Worker for HomiesLetsChat

const CACHE_NAME = 'homies-v2';
const urlsToCache = [
  '/homiesletschat/',
  '/homiesletschat/index.html',
  '/homiesletschat/manifest.json',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js',
  'https://cdn.jsdelivr.net/npm/emoji-picker-element@1.18.3/index.browser.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.warn('Cache addAll failed:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // For Firebase/CDN assets -> try cache, then network
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('cdn.jsdelivr') ||
    url.hostname.includes('cdnjs.cloudflare')
  ) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
    return;
  }

  // For HTML pages -> network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // For other assets -> cache first
  event.respondWith(
    caches.match(request)
      .then(response => response || fetch(request))
  );
});
