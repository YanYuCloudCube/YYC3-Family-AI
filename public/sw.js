// Service Worker for YYC3 Family AI
// Version: 1.0.0

const CACHE_NAME = 'yyc3-ai-v1';
const STATIC_CACHE_NAME = 'yyc3-ai-static-v1';
const DYNAMIC_CACHE_NAME = 'yyc3-ai-dynamic-v1';

// Resources to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/Web App/favicon-32.png',
  '/Web App/favicon-16.png',
  '/Web App/apple-touch-icon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except fonts and CDN resources)
  const isCrossOrigin = url.origin !== location.origin;
  const isAllowedCrossOrigin = 
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');
  
  if (isCrossOrigin && !isAllowedCrossOrigin) {
    return;
  }
  
  // Handle static assets (cache-first)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Handle API requests (network-first)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Handle navigation requests (network-first)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Check if request is for a static asset
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname);
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached new asset:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached dynamic content:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE_NAME);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch((error) => {
    console.error('[SW] Fetch failed:', error);
    return error;
  });
  
  return cachedResponse || fetchPromise;
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      caches.keys().then(async (cacheNames) => {
        const totalSize = await Promise.all(
          cacheNames.map(async (name) => {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            return keys.length;
          })
        );
        const client = await self.clients.get(event.source.id);
        client.postMessage({
          type: 'CACHE_STATUS',
          payload: {
            caches: cacheNames.length,
            totalEntries: totalSize.reduce((a, b) => a + b, 0),
          },
        });
      })
    );
  }
});

// ── Background Sync ──

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-files') {
    event.waitUntil(syncFiles());
  }

  if (event.tag === 'sync-settings') {
    event.waitUntil(syncSettings());
  }

  if (event.tag === 'sync-memories') {
    event.waitUntil(syncMemories());
  }
});

async function syncFiles() {
  try {
    const pendingSyncs = await getPendingSyncs('files');
    
    for (const sync of pendingSyncs) {
      try {
        const response = await fetch('/api/sync/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sync.data),
        });

        if (response.ok) {
          await removePendingSync('files', sync.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync file:', sync.id, error);
      }
    }

    await notifyClients({ type: 'SYNC_COMPLETE', tag: 'files' });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncSettings() {
  try {
    const pendingSyncs = await getPendingSyncs('settings');
    
    for (const sync of pendingSyncs) {
      try {
        const response = await fetch('/api/sync/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sync.data),
        });

        if (response.ok) {
          await removePendingSync('settings', sync.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync settings:', sync.id, error);
      }
    }

    await notifyClients({ type: 'SYNC_COMPLETE', tag: 'settings' });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncMemories() {
  try {
    const pendingSyncs = await getPendingSyncs('memories');
    
    for (const sync of pendingSyncs) {
      try {
        const response = await fetch('/api/sync/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sync.data),
        });

        if (response.ok) {
          await removePendingSync('memories', sync.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync memories:', sync.id, error);
      }
    }

    await notifyClients({ type: 'SYNC_COMPLETE', tag: 'memories' });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// ── IndexedDB Helpers for Background Sync ──

async function getPendingSyncs(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('yyc3-pending-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => reject(getAll.error);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

async function removePendingSync(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('yyc3-pending-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

// ── Push Notifications ──

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = { title: 'YYC³ Family AI', body: '您有新消息', icon: '/icons/icon-192x192.png' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: '打开' },
      { action: 'close', title: '关闭' },
    ],
    tag: data.tag || 'default',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// ── Periodic Background Sync ──

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);

  if (event.tag === 'sync-all') {
    event.waitUntil(
      Promise.all([
        syncFiles(),
        syncSettings(),
        syncMemories(),
      ])
    );
  }
});

console.log('[SW] Service Worker loaded - v2.0.0 with Background Sync & Push Notifications');
