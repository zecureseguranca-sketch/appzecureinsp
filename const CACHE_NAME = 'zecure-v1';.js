const CACHE_NAME = 'zecure-v1';

self.addEventListener('install', event => {
    console.log('✅ Service Worker instalado');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('✅ Service Worker ativado');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'Nova atualização',
        icon: '/zecurelogo.png',
        badge: '/zecurelogo.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: data.tag || 'zecure-notification',
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'close', title: 'Fechar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Zecure', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});