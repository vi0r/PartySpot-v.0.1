'use client';

import { usePathname } from 'next/navigation';
import BottomNavWrapper from '@/presentation/components/layout/BottomNavWrapper';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex-1 relative flex flex-col h-full overflow-hidden">
      {/* Scrollable content area — key triggers fade-in on route change */}
      <main key={pathname} className="flex-1 overflow-y-auto no-scrollbar page-transition">
        {children}
      </main>
      <BottomNavWrapper />
    </div>
  );
}
