/* QR Permanente - Service Worker
 * Strategy: app-shell cached on install, network-first for HTML, cache-first for hashed assets.
 */

const VERSION = "v1";
const CACHE_SHELL = `qr-shell-${VERSION}`;
const CACHE_RUNTIME = `qr-runtime-${VERSION}`;

const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.svg",
  "/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_SHELL && k !== CACHE_RUNTIME)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML: network-first with cache fallback (so updates ship fast)
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_RUNTIME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Hashed static assets (/_astro/*) and same-origin images: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && (url.pathname.startsWith("/_astro/") || /\.(svg|png|webp|woff2?|css|js|json)$/i.test(url.pathname))) {
          const copy = res.clone();
          caches.open(CACHE_RUNTIME).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    }),
  );
});
