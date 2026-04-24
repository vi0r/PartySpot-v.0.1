'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/infrastructure/services/supabase';
import { useAuthStore } from '@/application/stores/authStore';

export default function NotificationHandler() {
  const { user, fetchUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [notification, setNotification] = useState<{ id: string; content: string; sender_id: string; sender_name: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Ensure global auth state is initialized
  useEffect(() => {
    if (typeof fetchUser === 'function') {
      fetchUser().catch(err => console.error('Auth init failed', err));
    }
  }, [fetchUser]);


  // 2. Listen for ALL messages where the current user is the receiver
  useEffect(() => {
    // We only subscribe if we have a user
    if (!user || !user.id) return;

    try {
      const channel = supabase
        .channel(`global_notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload: { new: { id: string; content: string; sender_id: string } }) => {
            if (!payload || !payload.new) return;

            const handleNewMessage = async () => {
              try {
                // Only show internal UI popup if the app is active/foregrounded
                if (document.visibilityState === 'visible') {
                  // Don't show notification if user is already in the specific chat
                  if (pathname === `/messages/${payload.new.sender_id}`) return;

                  // Fetch sender name
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', payload.new.sender_id)
                    .single();

                  setNotification({
                    id: payload.new.id,
                    content: payload.new.content,
                    sender_id: payload.new.sender_id,
                    sender_name: profile?.username || 'Somebody'
                  });
                }

                // Clear existing timeout if any
                if (timeoutRef.current) clearTimeout(timeoutRef.current);

                // Auto-hide after 5 seconds
                timeoutRef.current = setTimeout(() => {
                  setNotification(null);
                }, 5000);
              } catch (err) {
                console.error('Error handling notification:', err);
              }
            };

            handleNewMessage();
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Supabase Realtime Channel Error');
          }
        });

      return () => {
        supabase.removeChannel(channel);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    } catch (err) {
      console.error('Notification setup failed', err);
    }
  }, [user, pathname, router]);

  return (
    <>
      {/* Message Notification Popup */}

      {notification && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[9999] pointer-events-none">
          <div 
            onClick={() => {
              router.push(`/messages/${notification.sender_id}`);
              setNotification(null);
            }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center gap-4 cursor-pointer active:scale-95 transition-all pointer-events-auto"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
               <span className="text-white font-black text-xs">MSG</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">New Message</p>
              <p className="text-sm font-bold text-white truncate">@{notification.sender_name}</p>
              <p className="text-xs text-zinc-400 truncate">{notification.content}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setNotification(null);
              }}
              className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors bg-white/5"
            >
              <span className="text-[10px] font-bold">DISMISS</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
