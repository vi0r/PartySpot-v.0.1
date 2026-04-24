'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, User, Users, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useUIStore } from '@/application/stores/uiStore';

export default function SideDockNav() {
  const pathname = usePathname();
  const { dockSide, isDockOpen, toggleDock } = useUIStore();
  const touchStart = useRef<number | null>(null);

  const navItems = [
    { href: '/feed',    label: 'Tonight', icon: Home },
    { href: '/map',     label: 'Map',     icon: Map },
    { href: '/people',  label: 'People',  icon: Users },
    { href: '/search',  label: 'Discover',icon: Search },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  // Close dock automatically on route change
  useEffect(() => {
    toggleDock(true); // Force close
  }, [pathname, toggleDock]);

  const isLeft = dockSide === 'left';

  // Swipe logic to close the dock
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null || !isDockOpen) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStart.current;

    // If dock is on left, swipe left (diff < -50) closes it
    // If dock is on right, swipe right (diff > 50) closes it
    if (isLeft && diff < -40) {
      toggleDock(true);
      touchStart.current = null;
    } else if (!isLeft && diff > 40) {
      toggleDock(true);
      touchStart.current = null;
    }
  };

  return (
    <>
      {/* Backdrop Overlay to close dock on outside click */}
      <div 
        className={`fixed inset-0 z-[100] transition-all duration-500 ${
          isDockOpen ? 'opacity-100 pointer-events-auto bg-black/20 backdrop-blur-[2px]' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => toggleDock(true)}
      />

      {/* Liquid Glass Vertical Dock */}
      <nav 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className={`fixed top-1/2 -translate-y-1/2 w-20 bg-zinc-900/95 border border-white/10 shadow-2xl z-[101] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center py-6 gap-6 rounded-[2.5rem] ${
          isLeft ? 'left-4' : 'right-4'
        } ${
          isDockOpen 
            ? 'opacity-100 translate-x-0 scale-100' 
            : (isLeft ? '-translate-x-32 opacity-0' : 'translate-x-32 opacity-0')
        }`}
      >
        {/* Navigation Items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${
                isActive ? 'text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white rounded-2xl shadow-lg z-0 animate-in zoom-in-75 duration-300" />
              )}
              <div className="relative z-10">
                 <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* The "Liquid Tongue" */}
      <button
        onClick={() => toggleDock()}
        className={`fixed top-1/2 -translate-y-1/2 w-3 h-48 bg-transparent z-[102] transition-all duration-500 rounded-full group ${
          isLeft ? 'left-2' : 'right-2'
        } ${isDockOpen ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'}`}
      >
        <div className={`absolute top-1/2 -translate-y-1/2 w-8 h-[72px] flex items-center justify-center bg-zinc-900/80 border border-white/5 backdrop-blur-md rounded-2xl transition-all duration-500 shadow-xl ${
            isLeft ? '-left-px' : '-right-px'
        } group-hover:w-10`}>
            {isLeft ? (
                <ChevronRight size={18} className="text-white" />
            ) : (
                <ChevronLeft size={18} className="text-white" />
            )}
        </div>
      </button>
    </>
  );
}
