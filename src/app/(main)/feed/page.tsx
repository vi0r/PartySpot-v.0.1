'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { 
  Heart, 
  Share2, 
  MapPin, 
  Loader2, 
  Plus, 
  Search, 
  Pencil,
  Users,
  MessageCircle,
  Bookmark as BookmarkIcon,
  ChevronRight
} from 'lucide-react';
import AddContentModal from '@/presentation/components/admin/AddContentModal';
import { useDataStore } from '@/application/stores/dataStore';
import { useHaptics } from '@/application/hooks/useHaptics';
import { useUIStore } from '@/application/stores/uiStore';
import { EventCardSkeleton } from '@/presentation/components/ui/Skeleton';
import EventComments from '@/presentation/components/feed/EventComments';
import MiniMap from '@/presentation/components/feed/MiniMap';
import MusicGenreFilters from '@/presentation/components/feed/MusicGenreFilters';

import { AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuthStore } from '@/application/stores/authStore';

interface Event {
  id: string;
  title: string;
  description: string;
  media_url?: string;
  is_official?: boolean;
  created_at: string;
  views_count?: number;
  source_url?: string;
  clubs?: {
    id: string;
    name: string;
    address?: string;
    lat?: number;
    lng?: number;
    category?: string;
  };
}

const CATEGORIES = ['All', 'Techno', 'House', 'Hip Hop', 'D&B', 'Latin', 'Pop', 'Bar', 'Electronic'];

export default function FeedPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userGoing, setUserGoing] = useState<string[]>([]);
  const [goingCounts, setGoingCounts] = useState<Record<string, number>>({});
  const [squads, setSquads] = useState<{ id: string, event_id: string, name: string }[]>([]);
  const [editData, setEditData] = useState<Event | null>(null);
  
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { feedActiveCategory, feedSearchQuery } = useUIStore();
  
  const { userLocation, requestLocation, calculateDistance, formatDistance, fetchClubs: fetchStoreClubs } = useDataStore();


  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterContent();
  }, [events, feedActiveCategory, feedSearchQuery]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchEvents(),
      fetchUserLikes(),
      fetchUserGoing(),
      fetchGoingCounts(),
      checkAdmin(),
      fetchStoreClubs(),
      fetchSquads()
    ]);
    setLoading(false);
  };

  const fetchSquads = async () => {
    try {
      const { data } = await supabase.from('squads').select(`
        id, event_id, name, status, creator_id
      `).eq('status', 'active');
      if (data) setSquads(data);
    } catch {
       // SQL might not exist yet, silently ignore
    }
  };


  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setIsAdmin(profile.is_admin);
    }
  };

  const fetchUserLikes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('event_likes')
      .select('event_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserLikes(data.map(l => l.event_id));
    }
  };

  const fetchUserGoing = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('event_going')
      .select('event_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserGoing(data.map(g => g.event_id));
    }
  };

  const fetchGoingCounts = async () => {
    const { data, error } = await supabase
      .from('event_going')
      .select('event_id');

    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.event_id] = (counts[item.event_id] || 0) + 1;
      });
      setGoingCounts(counts);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          clubs (
            id,
            name,
            address,
            lat,
            lng,
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
      setFilteredEvents(data || []);
    } catch (err: unknown) {
      console.error('Error fetching events:', (err as Error).message);
    }
  };

  const filterContent = () => {
    let result = [...events];

    // --- SMART RANKING ALGORITHM ---
    const now = new Date().getTime();
    const userGenres = user?.music_genres || [];
    
    let enrichedResults = result.map(event => {
       const popularity = Math.min((event.views_count || 0) / 500, 1);
       const eventTime = new Date(event.created_at).getTime();
       const hoursOld = Math.max(0, (now - eventTime) / (1000 * 60 * 60));
       const recency = Math.max(0, 1 - (hoursOld / 48));

       let distanceBonus = 0;
       if (userLocation && event.clubs?.lat && event.clubs?.lng) {
          const d = calculateDistance(userLocation.lat, userLocation.lng, event.clubs.lat, event.clubs.lng);
          distanceBonus = Math.max(0, 1 - (d / 5));
       }
       
       let genreMatchBonus = 0;
       const clubCat = event.clubs?.category || '';
       if (userGenres.length > 0 && clubCat) {
          if (userGenres.some((g: string) => g.toLowerCase() === clubCat.toLowerCase())) {
             genreMatchBonus = 1;
          }
       }
       
       const rawMatch = (genreMatchBonus * 0.6) + (distanceBonus * 0.2) + (popularity * 0.2);
       const matchPercent = user ? Math.floor(Math.max(65, rawMatch * 100)) : null;

       const totalScore = (popularity * 0.3) + (recency * 0.2) + (distanceBonus * 0.2) + (genreMatchBonus * 0.3);
       return { ...event, totalScore, hoursOld, distanceBonus, matchPercent };
    });

    // --- Music Genre Filter ---
    if (feedActiveCategory !== 'All') {
      enrichedResults = enrichedResults.filter(event => 
        event.clubs?.category?.toLowerCase() === feedActiveCategory.toLowerCase()
      );
    }

    // --- Search Filter ---
    if (feedSearchQuery) {
      const q = feedSearchQuery.toLowerCase();
      enrichedResults = enrichedResults.filter(event => 
        event.title.toLowerCase().includes(q) || 
        event.clubs?.name.toLowerCase().includes(q)
      );
    }

    enrichedResults.sort((a, b) => b.totalScore - a.totalScore);
    // ONLY KEEP TOP 3 FOR YOU (or all if filtered)
    setFilteredEvents(feedActiveCategory === 'All' && !feedSearchQuery ? enrichedResults.slice(0, 3) : enrichedResults);
  };

  const toggleLike = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      const isLiked = userLikes.includes(eventId);
      
      // Haptics for UI response
      const haptics = (window as unknown as { __haptics?: { trigger: (s: string) => void } }).__haptics || { trigger: () => {} };
      
      if (isLiked) {
        await supabase.from('event_likes').delete().eq('user_id', user.id).eq('event_id', eventId);
        setUserLikes(prev => prev.filter(id => id !== eventId));
        haptics.trigger('light');
      } else {
        await supabase.from('event_likes').insert({ user_id: user.id, event_id: eventId });
        setUserLikes(prev => [...prev, eventId]);
        haptics.trigger('medium');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleGoing = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      const isGoing = userGoing.includes(eventId);
      const haptics = (window as unknown as { __haptics?: { trigger: (s: string) => void } }).__haptics || { trigger: () => {} };
      
      if (isGoing) {
        await supabase.from('event_going').delete().eq('user_id', user.id).eq('event_id', eventId);
        setUserGoing(prev => prev.filter(id => id !== eventId));
        setGoingCounts(prev => ({
          ...prev,
          [eventId]: Math.max(0, (prev[eventId] || 0) - 1)
        }));
        haptics.trigger('light');
      } else {
        await supabase.from('event_going').insert({ user_id: user.id, event_id: eventId });
        setUserGoing(prev => [...prev, eventId]);
        setGoingCounts(prev => ({
          ...prev,
          [eventId]: (prev[eventId] || 0) + 1
        }));
        haptics.trigger('success');
      }
    } catch (error) {
      console.error('Error toggling going:', error);
    }
  };

  const handleShare = async (e: Event) => {
    const title = e.title;
    const text = `Check out ${e.title} at ${e.clubs?.name || 'PartySpot Cologne'}!`;
    const url = window.location.origin + `/clubs/${e.clubs?.id || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16 px-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-8 pt-4">
          {/* Stories skeleton */}
          <div className="flex items-center gap-3 py-4">
            <div className="skeleton w-[60px] h-[60px] rounded-full shrink-0" />
            <div className="flex-1 flex items-end gap-2 h-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 skeleton rounded-full" style={{ height: `${30 + (i % 4) * 12}px` }} />
              ))}
            </div>
          </div>
          {[1, 2, 3].map((i) => <EventCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 px-0 pb-40 selection:bg-pink-500/30 overflow-x-hidden">
      
      {/* MINIMAP (Top Component) */}
      <MiniMap />

      {/* MUSIC FILTERS */}
      <MusicGenreFilters />

      {/* SCROLLABLE CONTENT AREA */}
      <div className="max-w-2xl mx-auto px-6 pt-2">
        <div className="space-y-8">
           <div className="text-center pt-4 pb-2">
             <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none mb-2 underline decoration-pink-500 decoration-4 underline-offset-4">we outside</h1>
             <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Your top 3 personalized matches</p>
           </div>
           
           <div className="grid grid-cols-1 gap-12">
             {filteredEvents.map((event, idx) => (
                <div key={`curated-${event.id}`} className="relative">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-pink-500 text-white font-black italic rounded-full flex items-center justify-center text-xl z-30 shadow-2xl backdrop-blur-xl border border-white/20">#{idx + 1}</div>
                  <EventCard 
                    event={event} isAdmin={isAdmin} userLocation={userLocation} 
                    setEditData={setEditData} setShowAddModal={setShowAddModal} toggleLike={toggleLike} 
                    toggleGoing={toggleGoing} handleShare={handleShare} userLikes={userLikes} 
                    userGoing={userGoing} goingCounts={goingCounts} formatDistance={formatDistance} 
                    calculateDistance={calculateDistance} 
                    setActiveComments={setActiveComments}
                    squads={squads.filter((s) => s.event_id === event.id)}
                  />
                </div>
             ))}
           </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-24 space-y-4">
              <div className="inline-block p-6 rounded-full bg-zinc-900 border border-white/5">
                <Search size={40} className="text-zinc-700" />
              </div>
              <h3 className="text-white font-black uppercase italic tracking-tighter">No parties matched</h3>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeComments && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]" 
              onClick={() => setActiveComments(null)}
            />
            <EventComments 
              eventId={activeComments} 
              onClose={() => setActiveComments(null)} 
            />
          </>
        )}
      </AnimatePresence>

      <AddContentModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        type="event"
        onSuccess={fetchEvents}
        editData={editData}
      />
    </div>
  );
}

function EventCard({ 
  event, isAdmin, userLocation, setEditData, setShowAddModal, 
  toggleLike, toggleGoing, handleShare, userLikes, userGoing, 
  goingCounts, formatDistance, calculateDistance, setActiveComments, squads
}: { 
  event: Event & { matchPercent?: number | null }; 
  isAdmin: boolean; 
  userLocation: { lat: number, lng: number } | null;
  setEditData: (e: Event) => void;
  setShowAddModal: (b: boolean) => void;
  toggleLike: (id: string) => void;
  toggleGoing: (id: string) => void;
  handleShare: (e: Event) => void;
  userLikes: string[];
  userGoing: string[];
  goingCounts: Record<string, number>;
  formatDistance: (d: number) => string;
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  setActiveComments: (id: string) => void;
  squads: { id: string, event_id: string, name: string }[];
}) {
  const router = useRouter();
  const haptics = useHaptics();
  
  if (typeof window !== 'undefined') {
    (window as unknown as { __haptics?: { trigger: (s: string | object) => void } }).__haptics = haptics;
  }
  
  return (
    <article className="bg-zinc-900/70 rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-zinc-800 to-black">
        {event.media_url ? (
          <img
            src={event.media_url}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 absolute inset-0"
            alt={event.title}
          />
        ) : null}
        {/* Always-on gradient+initial fallback shown behind the image */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-zinc-900 to-black flex items-center justify-center">
          <span className="text-[6rem] font-black italic text-white/10 uppercase select-none tracking-tightest">
            {event.clubs?.name?.[0] || event.title?.[0] || 'P'}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent" />

        
        {event.matchPercent && (
           <div className="absolute top-6 left-6 px-4 py-2 bg-pink-500/90 text-[10px] font-black uppercase tracking-widest text-white rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.5)] backdrop-blur-md border border-white/20 whitespace-nowrap">
             🔥 {event.matchPercent}% Match
           </div>
        )}

        <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5 text-white/90 z-20">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">{(event.views_count || 120)} Live</span>
        </div>

        {event.is_official && !event.matchPercent && (
          <div className="absolute top-6 left-6 px-4 py-2 bg-pink-500 text-[9px] font-black uppercase tracking-widest text-white rounded-xl shadow-2xl backdrop-blur-md border border-white/20">
            Official
          </div>
        )}

        <button 
          onClick={() => event.clubs?.id && router.push(`/clubs/${event.clubs.id}`)}
          className="absolute bottom-6 left-6 right-6 flex items-center gap-4 bg-white/5 backdrop-blur-3xl p-4 rounded-3xl border border-white/10 hover:bg-white/10 transition-all text-left z-10 shadow-2xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
            <Image 
              src={`https://ui-avatars.com/api/?name=${event.clubs?.name || 'P'}&background=0D0D0D&color=fff&bold=true`} 
              className="w-full h-full object-cover"
              alt="" 
              width={48}
              height={48}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-black uppercase italic tracking-tighter leading-tight truncate">{event.clubs?.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <MapPin size={10} className="text-pink-500" />
               <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest truncate">
                  {event.clubs?.address || 'Cologne'}
               </span>
            </div>
          </div>
        </button>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2 leading-none">
              {event.title}
            </h2>
            <p className="text-zinc-400 text-sm font-medium italic line-clamp-2">
              {event.description}
            </p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => { setEditData(event); setShowAddModal(true); }}
              className="p-3 bg-zinc-800 rounded-2xl text-white hover:bg-white hover:text-black transition-all"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>


        {/* Squads Block */}
        <div className="pt-4 border-t border-white/5 mt-4">
           <div className="flex items-center justify-between mb-3">
             <h4 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Squads forming</h4>
             <button onClick={() => router.push(`/squads/new?event=${event.id}`)} className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"><Plus size={10} /> Create</button>
           </div>
           
           <div className="space-y-2">
             {squads?.length > 0 ? squads.slice(0, 3).map((squad: { id: string, name: string }) => (
               <div key={squad.id} className="w-full bg-zinc-950/60 rounded-2xl p-3 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all" onClick={() => router.push(`/squads/${squad.id}`)}>
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><Users size={14} /></div>
                     <div className="text-left">
                       <p className="text-white font-bold text-[10px] uppercase tracking-wider">{squad.name}</p>
                       <p className="text-zinc-500 text-[8px] uppercase tracking-widest mt-0.5">Tap to join</p>
                     </div>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-white" />
               </div>
             )) : (
               <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5 text-center flex flex-col items-center justify-center">
                 <p className="text-zinc-500 text-[9px] uppercase tracking-widest max-w-[200px] mx-auto">No squads formed yet. Be the first to start a group chat for this party.</p>
               </div>
             )}
           </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Users size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {goingCounts[event.id] || 0} Going
            </span>
          </div>
          {event.clubs?.category && (
            <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                {event.clubs.category}
              </span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => toggleLike(event.id)} className="p-2 rounded-xl transition-all active:scale-90">
              <Heart className={`${userLikes.includes(event.id) ? 'fill-pink-500 text-pink-500' : 'text-zinc-600'}`} size={16} />
            </button>
            <button onClick={() => handleShare(event)} className="p-2 rounded-xl text-zinc-600 active:scale-90 transition-all">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* PRIMARY CTAs */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => { toggleGoing(event.id); }}
            className={`py-4 rounded-[2rem] font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
              userGoing.includes(event.id)
                ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            {userGoing.includes(event.id) ? '✓ I\'m Going' : '🔥 I\'m Going'}
          </button>
          <button
            onClick={() => {
              const hasSquads = squads.some(s => s.event_id === event.id);
              if (hasSquads) {
                // If squads exist, go to the list/details
                router.push(`/clubs/${event.clubs?.id || ''}`);
              } else {
                // Otherwise drive creation
                router.push(`/squads/new?event=${event.id}`);
              }
            }}
            className="py-4 rounded-[2rem] font-black uppercase text-[11px] tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <Users size={14} />
            {squads.some(s => s.event_id === event.id) ? 'Join Squad' : 'Create Squad'}
          </button>

        </div>

        {/* Find People secondary CTA */}
        <button
          onClick={() => router.push('/people')}
          className="w-full mt-2 py-3 rounded-[2rem] font-black uppercase text-[11px] tracking-widest bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          👀 See Who's Going
        </button>
      </div>
    </article>
  );
}

