'use client';

import { useRouter, usePathname } from 'next/navigation';
import { requestFcmToken, onMessage, messaging } from '@/infrastructure/services/firebase';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/infrastructure/services/supabase';
import { useAuthStore } from '@/application/stores/authStore';

export default function NotificationHandler() {
  const { user, fetchUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [notification, setNotification] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const timeoutRef = useRef<any>(null);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) return;
    
    try {
      // Hide banner immediately to provide instant feedback
      setShowBanner(false);
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('[NotificationHandler] Permission granted, setting up FCM...');
        await setupFCM();
      } else {
        console.warn('[NotificationHandler] Permission denied or closed');
      }
    } catch (err) {
      console.error('[NotificationHandler] Error during permission request:', err);
    }
  };

  const setupFCM = async () => {
    if (!user?.id) {
      console.log('[NotificationHandler] No user ID, skipping FCM setup');
      return;
    }
    
    console.log('[NotificationHandler] Requesting FCM token...');
    const token = await requestFcmToken();
    if (token) {
      console.log('[NotificationHandler] FCM Token generated:', token);
      // Save token to Supabase
      const { error: upsertError } = await supabase
        .from('user_fcm_tokens')
        .upsert({ 
          user_id: user.id, 
          token: token,
          last_seen_at: new Date().toISOString()
        }, { onConflict: 'token' });
      
      if (upsertError) {
        console.error('[NotificationHandler] Error saving token to Supabase:', {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint
        });
        
        // Potential fix: try a simple insert if upsert with onConflict fails
        if (upsertError.code === '42703' || upsertError.code === '42P10') {
           console.log('[NotificationHandler] Attempting fallback insert...');
           await supabase.from('user_fcm_tokens').insert({ 
             user_id: user.id, 
             token: token 
           });
        }
      } else {
        console.log('[NotificationHandler] FCM Token successfully saved to DB');
        setShowBanner(false);
      }
    } else {
      console.warn('[NotificationHandler] Failed to get FCM token. Check permissions and Firebase config.');
    }
  };

  // 1. Ensure global auth state is initialized and check existing notification permissions
  useEffect(() => {
    if (typeof fetchUser === 'function') {
      fetchUser().catch(err => console.error('Auth init failed', err));
    }

    if (user?.id) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          setupFCM();
        } else if (Notification.permission === 'default') {
          // Only show banner if permission hasn't been requested yet
          setShowBanner(true);
        }
      }
    }
  }, [user?.id]);

  // Handle FCM foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground FCM Message received:', payload);
    });

    return () => unsubscribe();
  }, [messaging]);

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
          (payload) => {
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
  }, [user?.id, pathname]);

  return (
    <>
      {/* Permission Request Banner */}
      {showBanner && (
        <div className="fixed top-[env(safe-area-inset-top,44px)] left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[10000] p-4 animate-in slide-in-from-top duration-500">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-blue-500/30 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                <span className="text-lg">🔔</span>
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-tighter">Stay Notified</p>
                <p className="text-[10px] text-zinc-400 font-medium">Enable real-time message alerts</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowBanner(false)}
                className="px-4 py-2 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase"
              >
                Later
              </button>
              <button 
                onClick={handleEnableNotifications}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

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
