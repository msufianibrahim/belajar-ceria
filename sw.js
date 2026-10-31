// Offline cache. Cache-first, so BUMP THIS VERSION every time you deploy changes,
// otherwise the tablet keeps showing the old app.
const CACHE = 'belajar-ceria-v11';

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
  'js/subjects/index.js',
  'js/subjects/util.js',
  'js/subjects/math.js',
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
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
