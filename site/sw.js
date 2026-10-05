/* Service worker de Frases.
   La página trae las frases incrustadas, así que se pide primero a la red (para ver las nuevas)
   y, sin conexión, se sirve la última copia guardada. El build reemplaza VERSION en cada cambio. */
const VERSION = '{{VERSION}}';
const CACHE = 'frases-' + VERSION;
const FUENTES = 'frases-fuentes';
const PRECARGA = [
  './',
  'manifest.json',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon.ico'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('frases-') && k !== CACHE && k !== FUENTES).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // la página: red primero, copia guardada si no hay conexión
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put('./', copia)); } return r; })
        .catch(() => caches.match('./', { cacheName: CACHE }).then(r => r || caches.match('./')))
    );
    return;
  }

  // Google Fonts: la copia guardada al instante y se refresca por detrás
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FUENTES).then(async c => {
      const guardada = await c.match(req);
      const red = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => guardada);
      return guardada || red;
    }));
    return;
  }

  // iconos, manifest y demás archivos propios: caché primero
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
