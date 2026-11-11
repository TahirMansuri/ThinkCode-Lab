/*! coi-serviceworker v0.1.7 - Guido Zuidhof, MIT License */
let coepCredentialless = false;
if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', function (event) {
    const { request } = event;
    if (request.method !== 'GET' || new URL(request.url).pathname === '/__native_stdin') return;
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
    event.respondWith(
      fetch(request).then((response) => {
        if (response.status === 0) return response;
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
        newHeaders.set('Cross-Origin-Embedder-Policy', coepCredentialless ? 'credentialless' : 'require-corp');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }).catch((e) => console.error(e))
    );
  });
} else {
  (() => {
    if (window.crossOriginIsolated) return;
    const currentScript = document.currentScript;
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register(currentScript ? currentScript.src : 'coi-serviceworker.js').then(
        (registration) => {
          registration.addEventListener('updatefound', () => {
            window.location.reload();
          });
          if (registration.active && !navigator.serviceWorker.controller) {
            window.location.reload();
          }
        },
        (err) => {
          console.warn('coi-serviceworker not loaded:', err);
        }
      );
    }
  })();
}

