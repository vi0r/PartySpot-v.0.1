'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, User, Play } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/reels', label: 'Reels', icon: Play },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="absolute bottom-0 w-full bg-black/90 backdrop-blur-xl border-t border-zinc-900 pb-8 pt-3 px-6 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 transition-all duration-300 ${
              isActive ? 'text-white' : 'text-zinc-500'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : ''}`}>
               <Icon size={24} className={isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''} />
            </div>
            <span className={`text-[10px] mt-1 font-bold tracking-tight select-none uppercase ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
