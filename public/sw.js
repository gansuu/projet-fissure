/* Service worker de Fissure : l'application s'ouvre même sans réseau.
   Les données (Supabase) ne sont JAMAIS mises en cache ici : elles passent toujours par le réseau. */
const VERSION = 'fissure-v2-1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Pages : réseau d'abord, sinon la version en cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone()
          caches.open(VERSION).then(c => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html').then(r => r || caches.match('/'))),
    )
    return
  }

  const sameOrigin = url.origin === self.location.origin
  const isFont = FONT_HOSTS.includes(url.hostname)
  if (!sameOrigin && !isFont) return // Supabase et le reste : jamais touchés

  // Fichiers de l'app et polices : cache d'abord, mis à jour en arrière-plan
  event.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req)
        .then(res => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone()
            caches.open(VERSION).then(c => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || fresh
    }),
  )
})
