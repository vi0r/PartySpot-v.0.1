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
  Bookmark as BookmarkIcon 
} from 'lucide-react';
import AddContentModal from '@/presentation/components/admin/AddContentModal';
import { useDataStore } from '@/application/stores/dataStore';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userGoing, setUserGoing] = useState<string[]>([]);
  const [goingCounts, setGoingCounts] = useState<Record<string, number>>({});
  const [editData, setEditData] = useState<any>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { userLocation, requestLocation, calculateDistance, formatDistance } = useDataStore();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterContent();
  }, [searchQuery, activeCategory, events]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchEvents(),
      fetchUserLikes(),
      fetchUserGoing(),
      fetchGoingCounts(),
      checkAdmin()
    ]);
    setLoading(false);
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

    if (activeCategory !== 'All') {
      result = result.filter(e => {
         const clubCat = (e.clubs as any)?.category?.toUpperCase() || '';
         const activeCat = activeCategory.toUpperCase();
         return clubCat === activeCat;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
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
      if (isLiked) {
        await supabase.from('event_likes').delete().eq('user_id', user.id).eq('event_id', eventId);
        setUserLikes(prev => prev.filter(id => id !== eventId));
      } else {
        await supabase.from('event_likes').insert({ user_id: user.id, event_id: eventId });
        setUserLikes(prev => [...prev, eventId]);
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
      if (isGoing) {
        await supabase.from('event_going').delete().eq('user_id', user.id).eq('event_id', eventId);
        setUserGoing(prev => prev.filter(id => id !== eventId));
        setGoingCounts(prev => ({
          ...prev,
          [eventId]: Math.max(0, (prev[eventId] || 0) - 1)
        }));
      } else {
        await supabase.from('event_going').insert({ user_id: user.id, event_id: eventId });
        setUserGoing(prev => [...prev, eventId]);
        setGoingCounts(prev => ({
          ...prev,
          [eventId]: (prev[eventId] || 0) + 1
        }));
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
      <div className="min-h-screen bg-background pt-28 px-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden animate-shimmer h-[600px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 px-6 pb-24 selection:bg-pink-500/30">
      <div className="max-w-2xl mx-auto space-y-12">
        
        {/* Search & Filter Bar */}
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pink-500 transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Search clubs, genres, vibes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-3xl p-5 pl-14 text-white placeholder-zinc-600 focus:border-white/20 focus:bg-zinc-900 transition-all outline-none text-sm font-medium"
              />
            </div>
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditData(null);
                  setShowAddModal(true);
                }}
                className="w-14 h-14 shrink-0 rounded-3xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-90 shadow-lg shadow-white/10"
              >
                <Plus size={24} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
             <button
               onClick={() => setIsFilterOpen(!isFilterOpen)}
               className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-3 ${
                 activeCategory !== 'All' || isFilterOpen
                   ? 'bg-white text-black border-white shadow-lg shadow-white/5' 
                   : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:border-white/20'
               }`}
             >
               {activeCategory}
               <div className={`w-1.5 h-1.5 rounded-full ${isFilterOpen ? 'bg-pink-500' : 'bg-zinc-700'}`} />
             </button>

             <button 
               onClick={requestLocation}
               className={`w-14 h-14 shrink-0 rounded-3xl border flex items-center justify-center transition-all active:scale-90 ${
                 userLocation 
                   ? 'bg-zinc-900/50 text-blue-400 border-blue-500/20' 
                   : 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20'
               }`}
             >
               <MapPin size={20} />
             </button>
          </div>

          {isFilterOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setIsFilterOpen(false);
                  }}
                  className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                    activeCategory === cat 
                      ? 'bg-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/20' 
                      : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
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

function EventCard({ event, isAdmin, userLocation, setEditData, setShowAddModal, toggleLike, toggleGoing, handleShare, userLikes, userGoing, goingCounts, formatDistance, calculateDistance }: any) {
  const router = useRouter();
  
  return (
    <article className="bg-zinc-900/70 rounded-3xl border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl">
      <div className="relative aspect-[3/4] md:aspect-[9/16] overflow-hidden bg-gradient-to-br from-zinc-800 to-black">
        <img 
          src={event.media_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=800'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
          alt={event.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />
        <div className="absolute top-6 right-20 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5 text-white/90 z-20">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">{(event.views_count || 120)} Views</span>
        </div>
        {event.is_official && (
          <div className="absolute top-6 left-6 px-4 py-2 bg-pink-500 text-[9px] font-black uppercase tracking-widest text-white rounded-xl shadow-2xl backdrop-blur-md border border-white/20">
            Official
          </div>
        )}
        {isAdmin && (
          <button 
            onClick={() => {
              setEditData(event);
              setShowAddModal(true);
            }}
            className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-20"
          >
            <Pencil size={18} />
          </button>
        )}
        <button 
          onClick={() => event.clubs?.id && router.push(`/clubs/${event.clubs.id}`)}
          className="absolute bottom-6 left-6 right-6 flex items-center gap-4 bg-black/50 backdrop-blur-3xl p-4 rounded-3xl border border-white/10 hover:bg-black/70 transition-all text-left z-10 shadow-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center font-black text-white italic overflow-hidden shrink-0">
            <img 
              src={`https://ui-avatars.com/api/?name=${event.clubs?.name || 'P'}&background=0D0D0D&color=fff&bold=true`} 
              className="w-full h-full object-cover"
              alt="" 
            />
          </div>
          <div>
            <h3 className="text-white font-black uppercase italic tracking-tighter leading-tight">{event.clubs?.name}</h3>
            <div className="flex items-center gap-2 mt-1">
               <MapPin size={10} className="text-pink-500" />
               <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
                  {event.clubs?.address || 'Cologne'}
                  {userLocation && event.clubs?.lat && event.clubs?.lng && (
                    <span className="ml-2 text-blue-400 before:content-['•'] before:mr-2 before:text-zinc-600">
                      {formatDistance(calculateDistance(userLocation.lat, userLocation.lng, event.clubs.lat, event.clubs.lng))}
                    </span>
                  )}
               </span>
            </div>
          </div>
        </button>
      </div>
      <div className="p-8 space-y-6">
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-3 leading-none drop-shadow-lg">
            {event.title}
          </h2>
          <p className="text-zinc-300 text-sm font-medium leading-relaxed italic line-clamp-3">
            {event.description}
          </p>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-6">
            <button onClick={() => toggleLike(event.id)} className="flex items-center gap-2.5 group">
              <Heart className={`transition-all duration-300 ${userLikes.includes(event.id) ? 'fill-pink-500 text-pink-500 scale-110' : 'text-zinc-500 group-hover:text-white'}`} size={24} />
              <span className="text-[10px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase tracking-widest">
                 {userLikes.includes(event.id) ? 'Liked' : 'Like'}
              </span>
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleGoing(event.id)} className="flex items-center gap-2.5 group">
                <Users className={`transition-all duration-300 ${userGoing.includes(event.id) ? 'text-blue-400 scale-110' : 'text-zinc-500 group-hover:text-white'}`} size={24} />
                <span className="text-[10px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase tracking-widest">
                   {goingCounts[event.id] || 0} Going
                </span>
              </button>
            </div>
            <button onClick={() => handleShare(event)} className="flex items-center gap-2.5 group">
              <Share2 className="text-zinc-500 group-hover:text-white transition-colors" size={24} />
              <span className="text-[10px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase tracking-widest">Share</span>
            </button>
          </div>
          <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">
            {new Date(event.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </article>
  );
}
