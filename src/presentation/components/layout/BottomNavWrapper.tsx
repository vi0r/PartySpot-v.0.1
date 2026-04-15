'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/presentation/components/ui/BottomNav';
import { useKeyboard } from '@/application/hooks/useKeyboard';

export default function BottomNavWrapper() {
  const pathname = usePathname();
  const isKeyboardVisible = useKeyboard();
  
  // Define routes where the bottom nav should be HIDDEN
  const hideOnPaths = ['/', '/auth'];
  const isIndividualChat = pathname.startsWith('/messages/') && pathname !== '/messages';
  const shouldHide = hideOnPaths.includes(pathname) || isIndividualChat || isKeyboardVisible;

  if (shouldHide) return null;

  return <BottomNav />;
}
