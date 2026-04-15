'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { MessageCircle, Loader2, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/application/stores/authStore';
import { useKeyboard } from '@/application/hooks/useKeyboard';

export default function ChatPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const router = useRouter();
  const { user, fetchUser, loading: authLoading } = useAuthStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [bottomOffset, setBottomOffset] = useState(0);
  
  const isKeyboardVisible = useKeyboard();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial auth check
  useEffect(() => {
    if (!authLoading && !user && typeof fetchUser === 'function') {
      fetchUser();
    }
  }, [authLoading, user]);

  // 2. Chat initialization logic
  useEffect(() => {
    if (authLoading || !user?.id || !id) return;

    let isSubscribed = true;
    let channel: any = null;

    const fetchHistory = async () => {
      if (!user?.id || !id) return;
      
      const { data: msgs, error: msgsErr } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (msgsErr) {
        console.error('[Chat] History error:', msgsErr);
        return;
      }
      
      if (isSubscribed) {
        setMessages(msgs || []);
        setLoading(false);
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    const init = async () => {
      try {
        setLoading(true);
        setErrorStatus(null);

        // A. Fetch Friend
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (profErr) console.warn('[Chat] Friend fetch failed:', profErr);
        if (isSubscribed) setFriend(profile);

        // B. Fetch History
        await fetchHistory();

        // C. Setup Realtime
        channel = supabase
          .channel(`chat_${user.id}_${id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${user.id}`,
            },
            (payload) => {
              if (payload.new.sender_id === id) {
                setMessages(prev => {
                  // Avoid duplicates
                  if (prev.some(m => m.id === payload.new.id)) return prev;
                  return [...prev, payload.new];
                });
                setTimeout(() => scrollToBottom(), 100);
              }
            }
          )
          .subscribe((status) => {
            console.log('[Chat] Realtime status:', status);
            if (status === 'CHANNEL_ERROR' && isSubscribed) {
              setErrorStatus('Realtime sync issue. Messages might be delayed.');
            }
          });

      } catch (err: any) {
        console.error('[Chat] Init failure:', err);
        if (isSubscribed) {
          setErrorStatus(err.message || 'Error occurred during initialization');
          setLoading(false);
        }
      }
    };

    // Foreground sync listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Chat] App foregrounded, syncing messages...');
        fetchHistory();
      }
    };

    init();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, id, authLoading]);

  // Handle visual viewport for keyboard offset
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = window.innerHeight - vv.height;
      setBottomOffset(offset > 0 ? offset : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id || !id) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    // Optimistic UI update
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: id,
      content: msgText,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 100);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: id as string,
          content: msgText
        });

      if (error) throw error;
    } catch (err) {
      console.error('[Chat] Send error:', err);
      setErrorStatus('Message failed to send. Please try again.');
    }
  };

  if (authLoading || (loading && !friend)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-black">
        <Loader2 className="animate-spin text-white" size={32} />
        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-4">Connecting...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-black px-6 text-center">
        <MessageCircle size={48} className="text-pink-500 mb-6" />
        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">ACCESS DENIED</h2>
        <p className="text-zinc-500 text-sm font-medium mb-8">Please log in to chat.</p>
        <button onClick={() => router.push('/auth')} className="bg-white text-black font-black uppercase text-xs px-10 py-4 rounded-full shadow-2xl active:scale-95 transition-all">
          LOG IN
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-safe-screen bg-black overflow-hidden relative">
      {/* Header */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex items-center justify-between px-6 pt-[env(safe-area-inset-top,48px)] pb-4 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 z-30 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="text-white hover:bg-white/10 p-2 bg-white/5 rounded-full transition-colors active:scale-95 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div 
            onClick={() => id && router.push(`/users/${id}`)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-white font-black group-hover:border-blue-500 transition-colors">
              {friend?.avatar_url ? <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> : (friend?.username?.[0]?.toUpperCase() || 'U')}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors truncate max-w-[150px]">
                {friend?.username || friend?.email?.split('@')[0] || 'Loading...'}
              </h2>
              <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Direct message</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Bar */}
      {errorStatus && (
        <div className="bg-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-widest px-6 py-2.5 border-b border-red-500/30">
          {errorStatus}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 pt-[110px] pb-[100px] space-y-4 no-scrollbar">
        {(!messages || messages.length === 0) && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white font-black italic">
               MT
            </div>
            <p className="text-xs font-black text-white uppercase tracking-tighter">No History</p>
          </div>
        ) : (
          messages.map((msg: any) => {
            if (!msg || !msg.id) return null;
            const isMe = msg.sender_id === user.id;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200`}>
                <div 
                  className={`max-w-[85%] px-5 py-3.5 rounded-[1.5rem] shadow-xl ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-zinc-900 border border-white/5 text-white rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        {loading && messages.length === 0 && (
           <div className="flex justify-center p-8">
             <Loader2 size={24} className="animate-spin text-zinc-700" />
           </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div 
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] px-6 pt-4 bg-zinc-950/80 backdrop-blur-md border-t border-white/5 z-30 transition-all duration-200"
        style={{ 
          bottom: `${bottomOffset}px`,
          paddingBottom: bottomOffset > 0 ? '16px' : 'env(safe-area-inset-bottom, 32px)'
        }}
      >
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 relative">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-zinc-900 border border-white/5 rounded-full px-5 py-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500/50 transition-all pr-14 shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || loading}
            className="absolute right-2 px-6 py-2 bg-blue-600 text-white rounded-full disabled:opacity-30 disabled:grayscale transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-xl"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}
