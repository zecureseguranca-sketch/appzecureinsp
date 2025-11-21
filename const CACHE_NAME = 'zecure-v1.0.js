const CACHE_NAME = 'zecure-v1.0.5';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/zecurelogo.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalação - cacheia arquivos essenciais
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cacheando arquivos');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', event => {
    console.log('[Service Worker] Ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - estratégia Network First (sempre tenta buscar online primeiro)
self.addEventListener('fetch', event => {
    // Ignora requisições que não são GET
    if (event.request.method !== 'GET') return;

    // Ignora requisições para Google Apps Script API
    if (event.request.url.includes('script.google.com')) {
        return; // Deixa passar direto, sem cache
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Se a resposta for válida, clona e adiciona ao cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Se falhar, busca no cache
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Se não estiver no cache, retorna página offline
                    if (event.request.destination === 'document') {
                        return caches.match('/');
                    }
                });
            })
    );
});

// Notificações Push (para futuro uso)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação da Zecure',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'zecure-notification',
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification('Zecure', options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Sincronização em segundo plano
self.addEventListener('sync', event => {
    if (event.tag === 'sync-os-data') {
        event.waitUntil(syncOSData());
    }
});

async function syncOSData() {
    console.log('[Service Worker] Sincronizando dados em segundo plano...');
    // Aqui você pode implementar sincronização de dados offline
}

// Mensagens do cliente
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});