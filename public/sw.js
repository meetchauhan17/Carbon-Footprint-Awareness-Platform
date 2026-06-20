// ─── Cache Version ───────────────────────────────────────────────────────────
// BUMP THIS on every deploy so the old cache is wiped and rebuilt.
// Format: v<YYYYMMDD>-<N>
const CACHE_VERSION = 'v20260620-3';
const CACHE_NAME = `carbonwise-${CACHE_VERSION}`;

// Only pre-cache the app shell (not JS chunks — those are fetched on demand)
const SHELL_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ─── Activate — delete ALL old caches ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ─── Fetch strategy ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET + http(s) requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // ① API calls — always go to the network, never cache
  if (url.pathname.startsWith('/api/')) {
    return; // let browser handle it normally
  }

  // ② Hashed JS/CSS assets (/assets/...) — Cache-First
  //    These filenames include a content hash so they're safe to cache forever.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // ③ HTML navigation (index.html / SPA routes) — Network-First
  //    Always try the network so users get the latest deployment instantly.
  //    Only fall back to cache if completely offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a fresh copy for offline fallback
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Offline: serve the cached shell
          caches.match('/index.html')
        )
    );
    return;
  }

  // ④ Everything else (fonts, icons, manifest) — Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
