// Offline cache. Network-first: online, the tablet always gets the latest files;
// offline, it falls back to this cache. Bump CACHE when FILES changes.
const CACHE = 'belajar-ceria-v19';

const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/app.js',
  'js/storage.js',
  'js/audio.js',
  'js/rewards.js',
  'js/session.js',
  'js/progress.js',
  'js/lang.js',
  'js/catalog.js',
  'js/avatar.js', 'js/digits.js',
  'js/subjects/index.js',
  'js/subjects/util.js',
  'js/subjects/math.js',
  'js/subjects/iqra.js',
  'fonts/noto-naskh.ttf',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's HTTP cache, which could still hold old files.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
