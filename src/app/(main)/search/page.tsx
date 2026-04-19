'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Users, Music2, X, ArrowRight } from 'lucide-react';
import { supabase } from '@/infrastructure/services/supabase';
import { UserCardSkeleton, ClubCardSkeleton } from '@/presentation/components/ui/Skeleton';

type Tab = 'all' | 'clubs' | 'events' | 'people';

interface Club  { id: string; name: string; category?: string; address?: string; image_url?: string; }
interface Event { id: string; title: string; description?: string; media_url?: string; clubs?: Club; }
interface User  { id: string; username?: string; display_name?: string; avatar_url?: string; }

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(false);

  const [clubs,  setClubs]  = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [people, setPeople] = useState<User[]>([]);

  const CATEGORIES = ['Techno', 'House', 'Hip Hop', 'D&B', 'Latin', 'Pop', 'Bar', 'Electronic'];

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setClubs([]); setEvents([]); setPeople([]); return; }
    setLoading(true);
    const like = `%${q}%`;

    const [clubRes, eventRes, peopleRes] = await Promise.all([
      supabase.from('clubs').select('id, name, category, address, image_url')
        .or(`name.ilike.${like},category.ilike.${like},address.ilike.${like}`)
        .limit(10),
      supabase.from('events').select('id, title, description, media_url, clubs(id,name,image_url)')
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(10),
      supabase.from('profiles').select('id, username, display_name, avatar_url')
        .or(`username.ilike.${like},display_name.ilike.${like}`)
        .limit(10),
    ]);

    setClubs(clubRes.data  || []);
    setEvents(eventRes.data || []);
    setPeople(peopleRes.data || []);
    setLoading(false);
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => search(query), 350);
    return () => clearTimeout(t);
  }, [query, search]);

  const hasResults = clubs.length + events.length + people.length > 0;
  const isEmpty = query.trim().length > 0 && !loading && !hasResults;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'all',    label: 'All',    count: clubs.length + events.length + people.length },
    { id: 'clubs',  label: 'Clubs',  count: clubs.length  },
    { id: 'events', label: 'Events', count: events.length },
    { id: 'people', label: 'People', count: people.length },
  ];

  const showClubs  = (tab === 'all' || tab === 'clubs')  && clubs.length  > 0;
  const showEvents = (tab === 'all' || tab === 'events') && events.length > 0;
  const showPeople = (tab === 'all' || tab === 'people') && people.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 16px)' }}>
      
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Search</h1>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Clubs, events, people..."
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-11 pr-11 text-white text-sm placeholder:text-zinc-600 focus:border-white/15 focus:outline-none transition-colors font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs (only when searching) */}
      {query.trim() && (
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                tab === t.id
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/20'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-black text-white' : 'bg-white/10 text-zinc-400'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32 space-y-6">

        {/* Loading state */}
        {loading && (
          <div className="space-y-6 pt-4">
            <div className="space-y-3">
              {[1,2,3].map(i => <UserCardSkeleton key={i} />)}
            </div>
            <div className="space-y-3">
              {[1,2].map(i => <ClubCardSkeleton key={i} />)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
              <Search size={28} className="text-zinc-700" />
            </div>
            <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest">No results for "{query}"</p>
          </div>
        )}

        {/* No query: show category grid */}
        {!query.trim() && !loading && (
          <div className="space-y-6 pt-2">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Browse by vibe</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat, i) => {
                const colors = [
                  'from-pink-900/70 to-pink-900/30 border-pink-800/30',
                  'from-purple-900/70 to-purple-900/30 border-purple-800/30',
                  'from-blue-900/70 to-blue-900/30 border-blue-800/30',
                  'from-green-900/70 to-green-900/30 border-green-800/30',
                  'from-orange-900/70 to-orange-900/30 border-orange-800/30',
                  'from-cyan-900/70 to-cyan-900/30 border-cyan-800/30',
                  'from-red-900/70 to-red-900/30 border-red-800/30',
                  'from-indigo-900/70 to-indigo-900/30 border-indigo-800/30',
                ];
                return (
                  <button
                    key={cat}
                    onClick={() => setQuery(cat)}
                    className={`bg-gradient-to-br ${colors[i % colors.length]} border rounded-2xl p-4 text-left transition-all active:scale-95 hover:border-white/20`}
                  >
                    <Music2 size={20} className="text-white/60 mb-2" />
                    <p className="text-white font-black uppercase text-sm tracking-tighter">{cat}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <div className="space-y-6">

            {/* Clubs */}
            {showClubs && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                  <MapPin size={10} />
                  <span>Clubs</span>
                </div>
                <div className="space-y-2">
                  {clubs.map(club => (
                    <button
                      key={club.id}
                      onClick={() => router.push(`/clubs/${club.id}`)}
                      className="w-full flex items-center gap-3 bg-zinc-900/60 border border-white/5 rounded-2xl p-3 text-left hover:border-white/10 transition-all active:scale-[0.98] group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                        <img
                          src={club.image_url || `https://ui-avatars.com/api/?name=${club.name}&background=111&color=fff&bold=true`}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-sm uppercase tracking-tight truncate">{club.name}</p>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider truncate">{club.category} · {club.address}</p>
                      </div>
                      <ArrowRight size={16} className="text-zinc-700 group-hover:text-white shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Events */}
            {showEvents && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                  <Music2 size={10} />
                  <span>Events</span>
                </div>
                <div className="space-y-2">
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => router.push(`/clubs/${(event.clubs as any)?.id || ''}`)}
                      className="w-full flex items-center gap-3 bg-zinc-900/60 border border-white/5 rounded-2xl p-3 text-left hover:border-white/10 transition-all active:scale-[0.98] group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                        <img
                          src={event.media_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=100'}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-sm uppercase tracking-tight truncate">{event.title}</p>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider truncate">{(event.clubs as any)?.name || 'Event'}</p>
                      </div>
                      <ArrowRight size={16} className="text-zinc-700 group-hover:text-white shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* People */}
            {showPeople && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                  <Users size={10} />
                  <span>People</span>
                </div>
                <div className="space-y-2">
                  {people.map(user => (
                    <button
                      key={user.id}
                      onClick={() => router.push(`/users/${user.id}`)}
                      className="w-full flex items-center gap-3 bg-zinc-900/60 border border-white/5 rounded-2xl p-3 text-left hover:border-white/10 transition-all active:scale-[0.98] group"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-white/5 shrink-0">
                        <img
                          src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.display_name || user.username}&background=111&color=fff&bold=true`}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-sm uppercase tracking-tight truncate">{user.display_name || user.username}</p>
                        {user.username && <p className="text-zinc-500 text-[10px] font-bold tracking-wider truncate">@{user.username}</p>}
                      </div>
                      <ArrowRight size={16} className="text-zinc-700 group-hover:text-white shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
