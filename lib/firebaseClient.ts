import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCIqNwYeujJUL4StFfqxSvb_MeJcRYVXhY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "madni-education-trust.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "madni-education-trust",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "madni-education-trust.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "372435663137",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:372435663137:web:4cb37f8ad7c53d8470e660",
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
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BDC0lsUj1uAUMR2NOpRcBwHNHlC0iC33ktNesY5aYcQOGdorlDLlOY-GncAd9qGNdRLWLa1yqTLAeoeO1-BL_30";
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
