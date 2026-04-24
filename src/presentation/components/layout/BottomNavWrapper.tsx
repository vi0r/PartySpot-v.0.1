'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from '@/presentation/components/ui/BottomNav';
import SideDockNav from '@/presentation/components/ui/SideDockNav';
import FeedToolbar from '@/presentation/components/feed/FeedToolbar';
import { useKeyboard } from '@/application/hooks/useKeyboard';
import { useUIStore } from '@/application/stores/uiStore';

export default function BottomNavWrapper() {
  const pathname = usePathname();
  const isKeyboardVisible = useKeyboard();
  const { navStyle } = useUIStore();
  
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; 

  const isFeed = pathname === '/feed';

  // Routes where navigation should be HIDDEN
  const hideOnPaths = ['/', '/auth'];
  const isIndividualChat = pathname.startsWith('/messages/') && pathname !== '/messages';
  const shouldHideCompletely = (hideOnPaths.includes(pathname) || isIndividualChat || isKeyboardVisible) && !isFeed;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) > scrollThreshold) {
        if (diff > 0 && currentScrollY > 100) {
          setIsVisible(false); // Hide on scroll down
        } else {
          setIsVisible(true); // Show on scroll up
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (shouldHideCompletely && !isFeed) return null;

  // Render logic based on style
  // Render both if it's the feed for maximum accessibility
  return (
    <>
      {navStyle === 'side' && !isFeed && <SideDockNav />}
      <div 
        className={`fixed bottom-0 inset-x-0 mx-auto w-full max-w-[430px] z-[100] transition-transform duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex flex-col w-full">
          {isFeed && (
            <div className="px-4 pb-2">
              <FeedToolbar />
            </div>
          )}
          {navStyle === 'bottom' && <BottomNav />}
        </div>
      </div>
    </>
  );
}

