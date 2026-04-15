'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch(err => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }, []);
  
  return null;
}
