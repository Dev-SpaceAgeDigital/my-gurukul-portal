importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBlwhvIIZWyfO73AprEf7OLC_3Tbnqed9Y",
  projectId: "my-gurukul-fc10f",
  messagingSenderId: "31778808827",
  appId: "1:31778808827:web:ff61bb1899185f82c1e15e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'EduTrust Notification';
  const notificationBody = payload.notification?.body || payload.data?.body || 'You have received a new update.';
  const notificationIcon = payload.notification?.icon || payload.data?.icon || '/my-gurukul.png';
  
  const notificationOptions = {
    body: notificationBody,
    icon: notificationIcon,
    badge: notificationIcon,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.link || payload.data?.url || '/',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
