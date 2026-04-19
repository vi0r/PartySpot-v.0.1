'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { Search, MessageCircle, Clock, Loader2, ChevronRight, Users } from 'lucide-react';
import { useAuthStore } from '@/application/stores/authStore';

interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string;
  email: string;
}

export default function InboxPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      fetchInboxData();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchInboxData = async () => {
    try {
      setLoading(true);

      // Fetch all friend relationships for the user
      const { data: friendsData } = await supabase
        .from('friends')
        .select(`
          id,
          status,
          user_id1 (id, username, email, avatar_url),
          user_id2 (id, username, email, avatar_url)
        `)
        .or(`user_id1.eq.${user?.id},user_id2.eq.${user?.id}`);

      if (friendsData) {
        const accepted: FriendProfile[] = [];
        const pending: any[] = [];

        friendsData.forEach((f: any) => {
          const isSender = f.user_id1.id === user?.id;
          const otherUser = isSender ? f.user_id2 : f.user_id1;
          
          if (!otherUser) return;

          if (f.status === 'accepted') {
            accepted.push(otherUser);
          } else if (f.status === 'pending' && !isSender) {
            // Incoming pending requests
            pending.push({ ...otherUser, requestId: f.id });
          }
        });

        setFriends(accepted);
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error('Error fetching inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (!error) {
      fetchInboxData();
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-white mb-2" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6 text-center">
        <MessageCircle size={48} className="text-pink-500 mb-6" />
        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-4">MESSAGES</h2>
        <p className="text-zinc-500 text-sm font-medium mb-8">You need to log in to access your inbox and chat with friends.</p>
        <button onClick={() => router.push('/auth')} className="bg-white text-black font-black uppercase text-xs px-8 py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          Log In
        </button>
      </div>
    );
  }

  const filteredFriends = friends.filter(f => 
    (f.username || f.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-background min-h-screen pt-16 px-6 pb-24 overflow-y-auto no-scrollbar">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
            Inbox
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1 mt-1">Connect with friends</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/users')} className="bg-white hover:bg-zinc-200 text-black px-4 py-3 rounded-full font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Search size={14} /> Find People
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-white/5 rounded-[2rem] p-5 pl-14 text-white placeholder-zinc-600 focus:border-white/20 focus:bg-zinc-900 transition-all outline-none text-sm font-medium shadow-xl"
        />
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && !searchQuery && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-yellow-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Friend Requests ({pendingRequests.length})</h3>
          </div>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex justify-between items-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl">
                <div 
                  onClick={() => router.push(`/users/${req.id}`)}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-800 border border-yellow-500/30 overflow-hidden shrink-0 flex items-center justify-center text-white font-black">
                     {req.avatar_url ? <img src={req.avatar_url} alt="" className="w-full h-full object-cover" /> : (req.username?.[0]?.toUpperCase() || 'U')}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">@{req.username || req.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Wants to connect</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAcceptRequest(req.requestId)}
                  className="px-4 py-2 bg-yellow-500 text-black font-black uppercase text-[10px] tracking-widest rounded-full active:scale-95 transition-transform"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends / Chats List */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={16} className="text-blue-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Your Friends</h3>
        </div>
        
        <div className="space-y-2">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div 
                key={friend.id}
                onClick={() => router.push(`/messages/${friend.id}`)}
                className="flex justify-between items-center p-4 bg-zinc-900/40 hover:bg-zinc-800 border border-white/5 rounded-3xl cursor-pointer active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-white font-black">
                     {friend.avatar_url ? <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> : (friend.username?.[0]?.toUpperCase() || 'U')}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base leading-tight group-hover:text-blue-400 transition-colors">
                      {friend.username || friend.email?.split('@')[0] || 'Friend'}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      Tap to chat
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-700 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </div>
            ))
          ) : (
             <div className="text-center py-16 px-4 animate-in fade-in duration-500">
               <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                 <MessageCircle className="text-blue-400" size={36} />
               </div>
               <h3 className="text-white font-black text-xl italic uppercase tracking-tight mb-2">No Connections Yet</h3>
               <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-6 max-w-[220px] mx-auto">
                 Find people at events and start connecting with the nightlife community.
               </p>
               <button
                 onClick={() => router.push('/users')}
                 className="px-8 py-3.5 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
               >
                 Find People
               </button>
             </div>
          )}
        </div>
      </section>

    </div>
  );
}
