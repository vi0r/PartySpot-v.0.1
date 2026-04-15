'use client';

import { useEffect } from 'react';

export default function AppHeightFix() {
  useEffect(() => {
    const updateHeight = () => {
      // Use innerHeight instead of dvh to get a more stable value
      // on some mobile browsers.
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateHeight();
    
    // We only want to update this on actual window resize (orientation change),
    // not necessarily on keyboard resize.
    // However, innerHeight DOES change with keyboard on some browsers.
    // A more robust way is to check the ratio or only set it once.
    
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return null;
}
