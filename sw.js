/* Wincon 12 Service Worker - Patch 3 */

const CACHE_NAME = "wincon-cache-v1";
const PRECACHE_URLS = ["./", "./index.html"];

// インストール
self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);

        await cache.addAll(PRECACHE_URLS);

        await self.skipWaiting();
    })());
});

// 有効化
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        // キャッシュ管理はアップデートアプリ側で実行
        await self.clients.claim();
    })());
});

// 通信処理
self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return;

    // Module Center（Supabase Functions）は常にネットワークから取得
    if (request.url.includes("supabase.co/functions")) {
        event.respondWith(fetch(request));
        return;
    }

    // それ以外はキャッシュ優先
    event.respondWith((async () => {
        const cached = await caches.match(request);

        if (cached) {
            return cached;
        }

        // キャッシュにない場合はネットワークから取得
        const response = await fetch(request);

        // 正常なレスポンスのみキャッシュ
        if (response && (response.ok || response.type === "opaque")) {
            const copy = response.clone();

            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, copy))
                    .catch(error => {
                        console.warn(
                            "[Wincon SW] Cache write failed:",
                            error
                        );
                    })
            );
        }

        return response;
    })());
});
