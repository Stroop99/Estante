/* Estante – service worker: app offline + caché de portadas */
const VERSION = 'estante-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './vendor/barcode-ponyfill.js', './vendor/zxing_reader.wasm'];
const COVERS = 'estante-covers';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== COVERS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Archivos de la app: responde rápido desde caché y actualiza en segundo plano
  if (url.origin === location.origin && (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/'))) {
    // La página principal: primero red (así ves las actualizaciones al instante), caché si no hay internet
    e.respondWith(caches.open(VERSION).then(async c => {
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
      catch { return (await c.match(req, { ignoreSearch: true })) || c.match('./index.html'); }
    }));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req, { ignoreSearch: url.pathname.endsWith('index.html') || url.pathname.endsWith('/') });
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // Portadas remotas: caché primero, así se ven sin internet
  if (req.destination === 'image') {
    e.respondWith(caches.open(COVERS).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }
      catch { return new Response('', { status: 404 }); }
    }));
  }
  // Las APIs (JSON/JSONP) van directo a la red
});
