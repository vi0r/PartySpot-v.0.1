'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { Search, Loader2, ChevronLeft, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/application/stores/authStore';

const GRADIENT_PALETTE = [
  'from-pink-600/30 to-purple-900/30',
  'from-blue-600/30 to-cyan-900/30',
  'from-orange-600/30 to-red-900/30',
  'from-green-600/30 to-teal-900/30',
  'from-yellow-600/30 to-orange-900/30',
  'from-violet-600/30 to-indigo-900/30',
];

function ProfileCard({ profile, onAdd, isPending, isFriend, index }: any) {
  const router = useRouter();
  const gradient = GRADIENT_PALETTE[index % GRADIENT_PALETTE.length];
  const initials = (profile.username || profile.email || 'U')[0].toUpperCase();

  return (
    <div
      className="relative bg-zinc-900/60 border border-white/5 rounded-[2rem] overflow-hidden active:scale-[0.97] transition-all cursor-pointer group"
      onClick={() => router.push(`/users/${profile.id}`)}
    >
      {/* Gradient Top Band */}
      <div className={`h-20 w-full bg-gradient-to-br ${gradient}`} />

      {/* Avatar */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2">
        <div className="w-20 h-20 rounded-full border-4 border-zinc-900 bg-zinc-800 overflow-hidden flex items-center justify-center text-3xl font-black text-white shadow-2xl">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>
      </div>

      <div className="pt-12 pb-5 px-4 text-center space-y-1">
        <h4 className="text-white font-black text-base leading-none mt-1">
          @{profile.username || profile.email?.split('@')[0] || 'user'}
        </h4>
        <p className="text-zinc-500 text-[10px] font-medium line-clamp-1">
          {profile.bio || 'PartySpot member'}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(profile.id);
          }}
          className={`mt-3 w-full py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
            isFriend
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : isPending
              ? 'bg-white/5 text-zinc-500 border border-white/5'
              : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          {isFriend ? (
            <><UserCheck size={12} /> Friends</>
          ) : isPending ? (
            <><Loader2 size={12} className="animate-spin" /> Pending</>
          ) : (
            <><UserPlus size={12} /> Connect</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function UserSearchPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularUsers, setPopularUsers] = useState<any[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPopularUsers();
    if (user) fetchExistingRelations();
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length >= 2) performSearch();
      else setResults([]);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchPopularUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url, bio')
      .limit(12);
    if (data) setPopularUsers(data.filter(p => p.id !== user?.id));
  };

  const fetchExistingRelations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friends')
      .select('id, status, user_id1, user_id2')
      .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

    if (data) {
      const friends = new Set<string>();
      const pending = new Set<string>();
      data.forEach((f: any) => {
        const otherId = f.user_id1 === user.id ? f.user_id2 : f.user_id1;
        if (f.status === 'accepted') friends.add(otherId);
        else pending.add(otherId);
      });
      setFriendIds(friends);
      setPendingIds(pending);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, bio')
        .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(20);
      if (data) setResults(data.filter(p => p.id !== user?.id));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (targetId: string) => {
    if (!user) { router.push('/auth'); return; }
    if (pendingIds.has(targetId) || friendIds.has(targetId)) return;

    setPendingIds(prev => new Set([...prev, targetId]));
    await supabase.from('friends').insert({
      user_id1: user.id,
      user_id2: targetId,
      status: 'pending',
    });
  };

  const displayList = searchQuery.trim().length >= 2 ? results : popularUsers;
  const isSearch = searchQuery.trim().length >= 2;

  return (
    <div className="flex flex-col bg-background min-h-screen pt-12 px-5 pb-10 overflow-y-auto no-scrollbar">

      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <button
          onClick={() => router.back()}
          className="p-3 bg-zinc-900 border border-white/5 rounded-full active:scale-95 transition-transform text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
            {isSearch ? 'Results' : 'Discover'}
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
            {isSearch ? `${results.length} found` : 'Find your crew'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative group mb-7">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pink-500 transition-colors"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className="w-full bg-zinc-900/80 border border-white/5 rounded-[2rem] p-4 pl-12 text-white placeholder-zinc-600 focus:border-pink-500/30 focus:bg-zinc-900 transition-all outline-none text-sm font-medium"
        />
        {loading && (
          <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-pink-500 animate-spin" size={18} />
        )}
      </div>

      {/* Section Label */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className={isSearch ? 'text-pink-500' : 'text-blue-400'} />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          {isSearch ? 'Search Results' : 'People You May Know'}
        </h3>
      </div>

      {/* Grid */}
      {displayList.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {displayList.map((profile, i) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              index={i}
              onAdd={handleAdd}
              isPending={pendingIds.has(profile.id)}
              isFriend={friendIds.has(profile.id)}
            />
          ))}
        </div>
      ) : !loading && isSearch ? (
        <div className="text-center py-20 space-y-3">
          <div className="text-5xl">🔍</div>
          <h3 className="text-white font-black italic uppercase tracking-tight text-xl">Nobody Found</h3>
          <p className="text-zinc-500 text-xs font-medium">Try a different username or email</p>
        </div>
      ) : null}

    </div>
  );
}
