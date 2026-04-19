'use client';

import { useCallback } from 'react';

/**
 * A hook to trigger haptic feedback on devices that support it.
 * Falls back gracefully on unsupported devices (e.g. desktop).
 */
export function useHaptics() {
  const trigger = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (typeof window === 'undefined' || !navigator.vibrate) return;

    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10); // Very short, subtle single tap
          break;
        case 'medium':
          navigator.vibrate(30); // Standard tap
          break;
        case 'heavy':
          navigator.vibrate(50); // Harder tap
          break;
        case 'success':
          navigator.vibrate([15, 100, 30]); // Two quick taps, second one slightly longer
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]); // Two medium taps
          break;
        case 'error':
          navigator.vibrate([50, 50, 50, 50, 50]); // Series of heavier taps (buzz)
          break;
        default:
          navigator.vibrate(10);
      }
    } catch (e) {
      // Ignore vibration errors (e.g. triggered outside user gesture if browser restricts it)
      console.warn('Haptics failed:', e);
    }
  }, []);

  return { trigger };
}
