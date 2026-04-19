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
  Bookmark as BookmarkIcon 
} from 'lucide-react';
import AddContentModal from '@/presentation/components/admin/AddContentModal';
import { useDataStore } from '@/application/stores/dataStore';
import { useHaptics } from '@/application/hooks/useHaptics';
import { useUIStore } from '@/application/stores/uiStore';
import { EventCardSkeleton } from '@/presentation/components/ui/Skeleton';
import EventComments from '@/presentation/components/feed/EventComments';
import VinylStories from '@/presentation/components/feed/VinylStories';
import { AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
  const [editData, setEditData] = useState<any>(null);
  const { 
    feedSearchQuery, 
    feedActiveCategory 
  } = useUIStore();
  
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [friendsGoing, setFriendsGoing] = useState<Record<string, any[]>>({});
  
  const { userLocation, requestLocation, calculateDistance, formatDistance, fetchClubs: fetchStoreClubs } = useDataStore();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterContent();
  }, [feedSearchQuery, feedActiveCategory, events]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchEvents(),
      fetchUserLikes(),
      fetchUserGoing(),
      fetchGoingCounts(),
      checkAdmin(),
      fetchStoreClubs(),
      fetchFriendsGoing()
    ]);
    setLoading(false);
  };

  const fetchFriendsGoing = async () => {
    // In a real app, we'd join with a 'friends' table. 
    // For now, we'll mock some "friends" from the profiles table for visual effect
    const { data: profiles } = await supabase.from('profiles').select('avatar_url, username').limit(5);
    if (profiles) {
      // Assign fake friends to events for demo
      const mock: Record<string, any[]> = {};
      events.forEach(e => {
        mock[e.id] = profiles.slice(0, Math.floor(Math.random() * 5));
      });
      setFriendsGoing(mock);
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
    } catch (err: any) {
      console.error('Error fetching events:', err.message);
    }
  };

  const filterContent = () => {
    let result = [...events];

    if (feedActiveCategory !== 'All') {
      result = result.filter(e => {
         const clubCat = (e.clubs as any)?.category?.toUpperCase() || '';
         const activeCat = feedActiveCategory.toUpperCase();
         return clubCat === activeCat;
      });
    }

    if (feedSearchQuery) {
      const q = feedSearchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.clubs?.name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // --- SMART RANKING ALGORITHM ---
    const now = new Date().getTime();
    const enrichedResults = result.map(event => {
       const popularity = Math.min((event.views_count || 0) / 500, 1);
       const eventTime = new Date(event.created_at).getTime();
       const hoursOld = Math.max(0, (now - eventTime) / (1000 * 60 * 60));
       const recency = Math.max(0, 1 - (hoursOld / 48));

       let distanceBonus = 0;
       if (userLocation && event.clubs?.lat && event.clubs?.lng) {
          const d = calculateDistance(userLocation.lat, userLocation.lng, event.clubs.lat, event.clubs.lng);
          distanceBonus = Math.max(0, 1 - (d / 5));
       }

       const totalScore = (popularity * 0.4) + (recency * 0.3) + (distanceBonus * 0.3);
       return { ...event, totalScore, hoursOld, distanceBonus };
    });

    enrichedResults.sort((a, b) => b.totalScore - a.totalScore);
    setFilteredEvents(enrichedResults);
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
      const haptics = (window as any).__haptics || { trigger: () => {} };
      
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
      const haptics = (window as any).__haptics || { trigger: () => {} };
      
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
      
      {/* VINYL STORIES (Insta-like Top Component) */}
      <VinylStories />

      {/* SCROLLABLE CONTENT AREA */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="space-y-12">
          {/* 🔥 Trending Section */}
          {filteredEvents.some(e => (e as any).totalScore > 0.6) && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-2">
                <span className="text-xl">🔥</span>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Trending Now</h2>
              </div>
              <div className="grid grid-cols-1 gap-8">
                 {filteredEvents.filter(e => (e as any).totalScore > 0.6).slice(0, 3).map((event) => (
                  <EventCard 
                    key={`trending-${event.id}`} event={event} isAdmin={isAdmin} userLocation={userLocation} 
                    setEditData={setEditData} setShowAddModal={setShowAddModal} toggleLike={toggleLike} 
                    toggleGoing={toggleGoing} handleShare={handleShare} userLikes={userLikes} 
                    userGoing={userGoing} goingCounts={goingCounts} formatDistance={formatDistance} 
                    calculateDistance={calculateDistance} 
                    setActiveComments={setActiveComments}
                    friendsGoing={friendsGoing[event.id] || []}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 📍 Near You Section */}
          {userLocation && filteredEvents.some(e => (e as any).distanceBonus > 0.7) && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-2 border-t border-white/5 pt-8">
                <span className="text-xl">📍</span>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Near You</h2>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {filteredEvents.filter(e => (e as any).distanceBonus > 0.7).slice(0, 3).map((event) => (
                  <EventCard 
                    key={`near-${event.id}`} event={event} isAdmin={isAdmin} userLocation={userLocation} 
                    setEditData={setEditData} setShowAddModal={setShowAddModal} toggleLike={toggleLike} 
                    toggleGoing={toggleGoing} handleShare={handleShare} userLikes={userLikes} 
                    userGoing={userGoing} goingCounts={goingCounts} formatDistance={formatDistance} 
                    calculateDistance={calculateDistance} 
                    setActiveComments={setActiveComments}
                    friendsGoing={friendsGoing[event.id] || []}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 🆕 Latest Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2 border-t border-white/5 pt-8">
              <span className="text-xl">🆕</span>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Latest Mix</h2>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {filteredEvents.map((event) => (
                <EventCard 
                  key={`all-${event.id}`} event={event} isAdmin={isAdmin} userLocation={userLocation} 
                  setEditData={setEditData} setShowAddModal={setShowAddModal} toggleLike={toggleLike} 
                  toggleGoing={toggleGoing} handleShare={handleShare} userLikes={userLikes} 
                  userGoing={userGoing} goingCounts={goingCounts} formatDistance={formatDistance} 
                  calculateDistance={calculateDistance} 
                  setActiveComments={setActiveComments}
                  friendsGoing={friendsGoing[event.id] || []}
                />
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-24 space-y-4">
              <div className="inline-block p-6 rounded-full bg-zinc-900 border border-white/5">
                <Search size={40} className="text-zinc-700" />
              </div>
              <h3 className="text-white font-black uppercase italic tracking-tighter">No parties found</h3>
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
  goingCounts, formatDistance, calculateDistance, setActiveComments,
  friendsGoing
}: any) {
  const router = useRouter();
  const haptics = useHaptics();
  
  if (typeof window !== 'undefined') {
    (window as any).__haptics = haptics;
  }
  
  return (
    <article className="bg-zinc-900/70 rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-zinc-800 to-black">
        <Image 
          src={event.media_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=800'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
          alt={event.title}
          width={800}
          height={1000}
          priority={event.totalScore > 0.8}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5 text-white/90 z-20">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">{(event.views_count || 120)} Live</span>
        </div>

        {event.is_official && (
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

        {/* Social Presence */}
        {friendsGoing.length > 0 && (
          <div className="flex items-center gap-3 py-2 px-1">
            <div className="flex -space-x-3">
              {friendsGoing.slice(0, 3).map((friend: any, i: number) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden">
                  <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {friendsGoing.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400">
                  +{friendsGoing.length - 3}
                </div>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">
              Some friends are going
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-6">
            <button onClick={() => toggleLike(event.id)} className="flex flex-col items-center gap-1 group">
              <Heart className={`transition-all duration-300 ${userLikes.includes(event.id) ? 'fill-pink-500 text-pink-500 scale-110' : 'text-zinc-500 group-hover:text-white'}`} size={22} />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Like</span>
            </button>
            
            <button onClick={() => setActiveComments(event.id)} className="flex flex-col items-center gap-1 group">
              <MessageCircle className="text-zinc-500 group-hover:text-white transition-colors" size={22} />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Chat</span>
            </button>

            <button onClick={() => toggleGoing(event.id)} className="flex flex-col items-center gap-1 group">
              <Users className={`transition-all duration-300 ${userGoing.includes(event.id) ? 'text-blue-400 scale-110' : 'text-zinc-500 group-hover:text-white'}`} size={22} />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{goingCounts[event.id] || 0}</span>
            </button>

            <button onClick={() => handleShare(event)} className="flex flex-col items-center gap-1 group">
              <Share2 className="text-zinc-500 group-hover:text-white transition-colors" size={22} />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Share</span>
            </button>
          </div>
          
          <div className="text-right">
            <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mb-1">
              Started
            </p>
            <p className="text-[10px] text-white font-black uppercase italic tracking-tighter">
              {new Date(event.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
