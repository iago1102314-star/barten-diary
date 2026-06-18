/**
 * back bar — Service Worker
 *
 * 戦略:
 *   - 静的アセット（画像・フォント）: Cache First（初回後はキャッシュ優先）
 *   - Next.js JS/CSS チャンク: Stale While Revalidate
 *   - API / auth / Supabase: Network Only（キャッシュしない）
 *   - ナビゲーション（HTML）: Network First（オフライン時はキャッシュ）
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `bb-static-${CACHE_VERSION}`;
const PAGE_CACHE = `bb-pages-${CACHE_VERSION}`;

const NEVER_CACHE = [
  "/auth/",
  "/api/",
  "supabase.co",
  "accounts.google.com",
];

const shouldSkip = (url) =>
  NEVER_CACHE.some((pattern) => url.includes(pattern));

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([
        "/offline",
        "/manifest.webmanifest",
      ]).catch(() => {})
    )
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // 認証・API はキャッシュしない
  if (shouldSkip(url)) return;

  // Next.js 内部リクエスト（HMR 等）はスキップ
  if (url.includes("/_next/webpack-hmr") || url.includes("/_next/static/development")) return;

  // GET 以外はスキップ
  if (request.method !== "GET") return;

  const isNavigation = request.mode === "navigate";
  const isNextChunk = url.includes("/_next/");
  const isStaticAsset = /\.(webp|png|jpg|jpeg|svg|woff2?|ico)(\?|$)/.test(url);

  if (isStaticAsset) {
    // Cache First
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  if (isNextChunk) {
    // Stale While Revalidate
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached ?? fetchPromise;
      })
    );
    return;
  }

  if (isNavigation) {
    // Network First（オフライン時は /offline へ）
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        return (
          cached ??
          caches.match("/offline") ??
          new Response("オフラインです", { status: 503, headers: { "Content-Type": "text/plain" } })
        );
      })
    );
  }
});
