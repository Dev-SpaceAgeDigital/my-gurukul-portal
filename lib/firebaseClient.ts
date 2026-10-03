import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBlwhvIIZWyfO73AprEf7OLC_3Tbnqed9Y",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "my-gurukul-fc10f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "my-gurukul-fc10f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "my-gurukul-fc10f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "31778808827",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:31778808827:web:ff61bb1899185f82c1e15e",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export async function requestFcmToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;

    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser environment.');
      return null;
    }

    // 1. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Browser Notification permission was denied by user.');
      return null;
    }

    // 2. Register Service Worker
    let registration: ServiceWorkerRegistration | null = null;
    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
    }

    // 3. Obtain FCM Device Token (VAPID key is required for web push subscriptions)
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BKo7nfOVZgvCL4tuHTs_P8AoHXl9-xvZYXvZbzfSRR8kHaytl_n0A0prOECPahYuiBdz2NDBRDNg3QQ9V4OnLlk";
    if (!vapidKey) {
      console.error('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. Cannot get FCM token.');
      return null;
    }
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration || undefined,
    });

    if (token) {
      // 4. Save FCM Token to backend database
      await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return token;
    }
  } catch (error) {
    console.error('Failed to register FCM token:', error);
  }
  return null;
}

export const requestFcmPermissionAndRegister = requestFcmToken;

export async function listenToForegroundNotifications(callback: (payload: any) => void) {
  try {
    if (typeof window === 'undefined') return;
    const supported = await isSupported();
    if (!supported) return;

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      console.log('Foreground FCM Message received:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error listening to foreground notifications:', error);
  }
}
