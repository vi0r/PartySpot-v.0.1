import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if we have the core config
const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

const app = (getApps().length > 0) 
  ? getApp() 
  : (isConfigValid ? initializeApp(firebaseConfig) : null);

let messaging: Messaging | null = null;

// Messaging logic needs to be client-side only
if (typeof window !== 'undefined' && app && isConfigValid) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.error('Failed to initialize Firebase Messaging:', err);
  }
} else if (typeof window !== 'undefined' && !isConfigValid) {
  console.warn('[Firebase] Firebase Messaging is disabled because configuration is missing in .env.local');
}

export { app, messaging, getToken, onMessage };

export const requestFcmToken = async () => {
  if (!messaging) return null;
  
  try {
    // 1. Ensure Service Worker is ready
    if (!('serviceWorker' in navigator)) {
       console.warn('[Firebase] Service Workers not supported in this browser.');
       return null;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error('[Firebase] Service Worker registration not found.');
      return null;
    }

    // 2. Request token with explicit service worker registration
    // This fixes the "Cannot read properties of undefined (reading 'pushManager')" error
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    
    return token;
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
};
