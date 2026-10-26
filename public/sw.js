/* DUOPOP service worker. Penanda versi build diisi otomatis saat build agar cache lama dibersihkan. */
const VERSION = 'duopop-__BUILD__';
const ASSETS = 'duopop-assets'; // berkas /assets/ bernama-hash (tidak pernah berubah) — dipertahankan lintas versi
const SCOPE = self.registration.scope;
const SHELL = ['./', './offline.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
const abs = (u) => new URL(u, SCOPE).href;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(abs(u), { cache: 'reload' }))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k !== ASSETS).map((k) => caches.delete(k)));
    const a = await caches.open(ASSETS); const reqs = await a.keys();
    if (reqs.length > 150) await Promise.all(reqs.slice(0, reqs.length - 150).map((r) => a.delete(r))); // batasi ukuran
    await self.clients.claim();
  })());
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase & layanan eksternal tidak di-cache
  if (req.mode === 'navigate') {
    // Selalu ambil HTML terbaru dari jaringan (lewati cache HTTP) agar tidak merujuk berkas lama yang sudah dihapus.
    e.respondWith(fetch(new Request(req, { cache: 'no-store' })).then((r) => { const cp = r.clone(); if (r.ok) caches.open(VERSION).then((c) => c.put(abs('./'), cp)); return r; })
      .catch(async () => (await caches.match(abs('./'))) || caches.match(abs('./offline.html'))));
    return;
  }
  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.open(ASSETS).then(async (c) => {
      const hit = await c.match(req); if (hit) return hit;
      const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r;
    }));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
