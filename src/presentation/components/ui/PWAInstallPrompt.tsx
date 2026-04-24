'use client';

import React, { useState, useEffect } from 'react';
import { Share, X, PlusSquare } from 'lucide-react';
import { useHaptics } from '@/application/hooks/useHaptics';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const haptics = useHaptics();

  useEffect(() => {
    // Check if we are on client
    if (typeof window === 'undefined') return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detect if the app is already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      ('standalone' in window.navigator && (window.navigator as Navigator & { standalone: boolean }).standalone === true);

    // Show prompt if on iOS SDK, NOT standalone, and hasn't dismissed it
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');

    if (isIOSDevice && !isStandalone && !hasDismissed) {
      // Delay prompt slightly so it's not jarring on first load
      const timer = setTimeout(() => {
        setShowPrompt(true);
        haptics.trigger('medium');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [haptics]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    haptics.trigger('light');
  };

  if (!showPrompt || !isIOS) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[100] p-4 pb-[calc(1rem+env(safe-area-inset-bottom,20px))] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        
        <div className="flex flex-col items-center text-center mt-2 space-y-3">
          <div className="w-14 h-14 bg-black rounded-2xl border border-white/10 flex items-center justify-center shadow-lg">
            <span className="text-xl font-black italic tracking-tighter text-white">PS</span>
          </div>
          
          <div>
            <h3 className="text-white font-black text-lg italic uppercase tracking-tighter">Install PartySpot</h3>
            <p className="text-zinc-400 text-xs font-medium leading-relaxed mt-1">Get the full native experience. Install the app to your Home Screen.</p>
          </div>
          
          <div className="flex items-center gap-2 text-zinc-300 text-sm font-bold bg-white/5 px-4 py-3 rounded-full mt-2 w-full justify-center">
            Tap <Share size={16} className="text-blue-500 mx-1" /> then <PlusSquare size={16} className="text-zinc-400 mx-1" /> Add to Home Screen
          </div>
        </div>
      </div>
    </div>
  );
}
