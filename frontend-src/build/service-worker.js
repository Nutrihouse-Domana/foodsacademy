// Incremente a versao ao alterar a pagina offline para renovar seu cache.
const CACHE_PREFIX = "foods-academy-offline-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_URL = new URL("offline.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  // Armazena apenas a tela publica de indisponibilidade, sem dados de usuarios.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.add(new Request(OFFLINE_URL, { cache: "reload" }))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Remove somente versoes antigas do cache deste PWA.
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);

  // Intercepta apenas a abertura de telas React; APIs, videos e downloads seguem pela rede.
  if (
    request.method !== "GET" ||
    request.mode !== "navigate" ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)
  ) return;

  const path = url.pathname.slice(scope.pathname.length);
  const isAppPage = /^(?:|index\.html|home\/?|cards\/?|sobre\/?|contatos\/?|(?:video|materiais)\/[^/]+\/?)$/.test(path);
  if (!isAppPage) return;

  // Preserva respostas HTTP e a validacao LDAP; exibe o aviso apenas quando a rede falhar.
  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(OFFLINE_URL)) || Response.error();
    })
  );
});
