'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/ui/BottomNav';

export default function BottomNavWrapper() {
  const pathname = usePathname();
  
  // Define routes where the bottom nav should be HIDDEN
  const hideOnPaths = ['/', '/auth'];
  const shouldHide = hideOnPaths.includes(pathname);

  if (shouldHide) return null;

  return <BottomNav />;
}
