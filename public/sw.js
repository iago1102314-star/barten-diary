/**
 * back bar — Service Worker（production のみ登録）
 *
 * 静的アセット（public/ 配下の画像等）のみ Cache First。
 * Next.js の JS/CSS チャンク（/_next/）は一切触らない — デプロイごとに
 * ハッシュが変わるためキャッシュするとクラッシュの原因になる。
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `bb-static-${CACHE_VERSION}`;

const NEVER_CACHE = [
  "/auth/",
  "/api/",
  "/_next/",
  "supabase.co",
  "accounts.google.com",
];

const shouldSkip = (url) =>
  NEVER_CACHE.some((pattern) => url.includes(pattern));

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache
        .addAll(["/offline", "/manifest.webmanifest"])
        .catch(() => {}),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  if (shouldSkip(url)) return;
  if (request.method !== "GET") return;

  const isStaticAsset = /\.(webp|png|jpg|jpeg|svg|woff2?|ico)(\?|$)/.test(url);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          caches.match("/offline") ??
          new Response("オフラインです", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    );
  }
});
