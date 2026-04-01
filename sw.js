// ═══════ 護理長行程管理 — Service Worker ═══════
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase init in SW (for background messages)
firebase.initializeApp({
  apiKey: "AIzaSyDAR_sR9gNyh-eo8z51I7ku3VgAo9wwoVI",
  authDomain: "nurse-scheduler-ff051.firebaseapp.com",
  projectId: "nurse-scheduler-ff051",
  storageBucket: "nurse-scheduler-ff051.firebasestorage.app",
  messagingSenderId: "658105158354",
  appId: "1:658105158354:web:4209e5c1dc5ffd08c4bb0b"
});
const messaging = firebase.messaging();

// Handle background messages from FCM
messaging.onBackgroundMessage(function(payload) {
  console.log('BG message:', payload);
  const title = (payload.notification && payload.notification.title) || '護理長行程管理';
  const body = (payload.notification && payload.notification.body) || '';
  return self.registration.showNotification(title, {
    body: body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: './' },
  });
});

const CACHE_NAME = 'nurse-scheduler-v7';
const SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js',
];

// Install
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleapis.com') || url.hostname.includes('fcm')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return resp;
      });
    }).catch(() => {
      if (e.request.mode === 'navigate') return caches.match('./index.html');
    })
  );
});

// ═══════ PUSH NOTIFICATION HANDLER ═══════
self.addEventListener('push', (e) => {
  let data = { title: '護理長行程管理', body: '您有新的通知' };
  
  if (e.data) {
    try {
      const payload = e.data.json();
      if (payload.notification) {
        data = payload.notification;
      } else if (payload.data) {
        data = payload.data;
      }
    } catch (err) {
      data.body = e.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'nurse-scheduler-' + Date.now(),
    data: { url: data.click_action || data.url || './' },
    actions: [{ action: 'open', title: '開啟' }],
  };

  e.waitUntil(self.registration.showNotification(data.title || '護理長行程管理', options));
});

// 點擊通知 → 開啟 App
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('nurse-scheduler') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
