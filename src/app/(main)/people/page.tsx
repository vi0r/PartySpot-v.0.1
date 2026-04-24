'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { useAuthStore } from '@/application/stores/authStore';
import { useHaptics } from '@/application/hooks/useHaptics';
import { Users, Flame, Search, UserPlus } from 'lucide-react';
import Image from 'next/image';

const TONIGHT_TABS = ['All', 'Going Out', 'Looking for Squad'];

// Very simple shared-genres match % calculation
function calcMatchPercent(myGenres: string[], theirGenres: string[], theirStatus: string): number {
  const base = 55;
  const mySet = new Set((myGenres || []).map((g: string) => g.toLowerCase()));
  const overlap = (theirGenres || []).filter((g: string) => mySet.has(g.toLowerCase())).length;
  const genreBonus = mySet.size > 0 ? Math.min((overlap / mySet.size) * 35, 35) : 0;
  const statusBonus = theirStatus === 'Looking for Squad' ? 10 : 0;
  return Math.floor(Math.min(99, base + genreBonus + statusBonus));
}

function MatchBadge({ percent }: { percent: number }) {
  const color = percent >= 85 ? 'from-pink-500 to-orange-500' : percent >= 70 ? 'from-blue-500 to-cyan-500' : 'from-zinc-600 to-zinc-700';
  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${color} text-white text-[10px] font-black uppercase tracking-widest shadow-lg`}>
      🔥 {percent}% Match
    </div>
  );
}

export default function PeoplePage() {
  const router = useRouter();
  const haptics = useHaptics();
  const { user } = useAuthStore();
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, vibe, music_genres, tonight_status')
        .neq('id', user?.id || '')
        .limit(30);
      if (data) setPeople(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetId: string) => {
    if (!user) { router.push('/auth'); return; }
    if (pendingIds.has(targetId)) return;
    haptics.trigger('medium');
    setPendingIds(prev => new Set([...prev, targetId]));
    await supabase.from('friends').insert({
      user_id1: user.id,
      user_id2: targetId,
      status: 'pending',
    }).then(() => haptics.trigger('success')).catch(() => {});
  };

  const myGenres: string[] = user?.music_genres || [];

  const filtered = people
    .filter(p => tab === 'All' || p.tonight_status === tab)
    .map(p => ({ ...p, matchPercent: calcMatchPercent(myGenres, p.music_genres || [], p.tonight_status || '') }))
    .sort((a, b) => b.matchPercent - a.matchPercent);

  const goingOut = people.filter(p => p.tonight_status === 'Going Out').length;
  const lookingSquad = people.filter(p => p.tonight_status === 'Looking for Squad').length;

  return (
    <div className="min-h-screen bg-background pb-32" style={{ paddingTop: 'env(safe-area-inset-top, 16px)' }}>

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">People</h1>
          <button
            onClick={() => router.push('/users')}
            className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-90"
          >
            <Search size={20} />
          </button>
        </div>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Who's going out tonight</p>
      </div>

      {/* Live stats */}
      <div className="flex gap-3 px-6 mb-5">
        <div className="flex-1 bg-zinc-900/60 border border-white/5 rounded-3xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Out Tonight</span>
          </div>
          <p className="text-3xl font-black italic text-white tracking-tighter">{goingOut}</p>
        </div>
        <div className="flex-1 bg-zinc-900/60 border border-white/5 rounded-3xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Need Squad</span>
          </div>
          <p className="text-3xl font-black italic text-white tracking-tighter">{lookingSquad}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 mb-6 overflow-x-auto no-scrollbar">
        {TONIGHT_TABS.map(t => (
          <button
            key={t}
            onClick={() => { haptics.trigger('light'); setTab(t); }}
            className={`shrink-0 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
              tab === t
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-zinc-500 border-white/10'
            }`}
          >
            {t === 'All' && '🌍 '}
            {t === 'Going Out' && '🔥 '}
            {t === 'Looking for Squad' && '👀 '}
            {t}
          </button>
        ))}
      </div>

      {/* People list */}
      <div className="px-6 space-y-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-zinc-900/50 rounded-3xl animate-pulse border border-white/5" />
            ))
          : filtered.length === 0
            ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-20 h-20 mx-auto bg-zinc-900 rounded-full flex items-center justify-center">
                  <Users size={36} className="text-zinc-700" />
                </div>
                <h3 className="text-white font-black italic uppercase tracking-tighter text-xl">Nobody here yet</h3>
                <p className="text-zinc-500 text-xs">Be the first to set your status!</p>
              </div>
            )
            : filtered.map(person => (
              <div
                key={person.id}
                className="bg-zinc-900/60 border border-white/5 rounded-3xl p-4 flex items-center gap-4 hover:border-white/10 transition-all active:scale-[0.98] cursor-pointer"
                onClick={() => router.push(`/users/${person.id}`)}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 bg-zinc-800">
                    <Image
                      src={person.avatar_url || `https://ui-avatars.com/api/?name=${person.username || 'U'}&background=18181b&color=fff&bold=true`}
                      alt={person.username || 'User'}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Status dot */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                    person.tonight_status === 'Going Out' ? 'bg-green-500' :
                    person.tonight_status === 'Looking for Squad' ? 'bg-blue-500' : 'bg-zinc-600'
                  }`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-black text-sm uppercase tracking-tight truncate">
                      @{person.username || 'user'}
                    </p>
                    {person.vibe && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 border border-white/10 px-2 py-0.5 rounded-full">
                        {person.vibe}
                      </span>
                    )}
                  </div>
                  <MatchBadge percent={person.matchPercent} />
                  {(person.music_genres || []).length > 0 && (
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest truncate">
                      {person.music_genres.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </div>

                {/* Action */}
                <button
                  onClick={e => { e.stopPropagation(); handleConnect(person.id); }}
                  className={`shrink-0 p-3 rounded-2xl transition-all active:scale-90 ${
                    pendingIds.has(person.id)
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                  }`}
                >
                  {pendingIds.has(person.id) ? (
                    <Flame size={18} />
                  ) : (
                    <UserPlus size={18} />
                  )}
                </button>
              </div>
            ))
        }
      </div>
    </div>
  );
}
