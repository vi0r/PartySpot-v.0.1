'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
import AddContentModal from '@/components/admin/AddContentModal';

interface Event {
  id: string;
  title: string;
  description?: string;
  media_url?: string;
  is_official?: boolean;
  created_at: string;
  clubs?: {
    id: string;
    name: string;
    address?: string;
  };
}

const CATEGORIES = ['All', 'Techno', 'House', 'Hip Hop', 'Latin', 'Pop', 'Bar', 'Electronic'];

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
            address
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
      result = result.filter(e => (e as any).category === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        (e as any).clubs?.name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    setFilteredEvents(result);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-28 px-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden animate-shimmer h-[500px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-28 px-6 pb-24 selection:bg-pink-500/30">
      <div className="max-w-2xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex justify-between items-center px-2">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
              Feed <span className="text-pink-500">Cologne</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Live from the scene</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => {
                setEditData(null);
                setShowAddModal(true);
              }}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-90 shadow-lg shadow-white/10"
            >
              <Plus size={24} />
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pink-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search clubs, genres, vibes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-3xl p-5 pl-14 text-white placeholder-zinc-600 focus:border-white/20 focus:bg-zinc-900 transition-all outline-none text-sm font-medium"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  activeCategory === cat 
                    ? 'bg-white text-black border-white shadow-lg shadow-white/5' 
                    : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          {filteredEvents.map((event) => (
            <article key={event.id} className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img 
                  src={event.media_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=800'} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={event.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/20" />
                
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
                  className="absolute bottom-6 left-6 right-6 flex items-center gap-4 bg-black/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 hover:bg-black/60 transition-all text-left z-10"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center font-black text-white italic overflow-hidden">
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
                       <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">{event.clubs?.address || 'Cologne'}</span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Interaction Details */}
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2 leading-tight">
                    {event.title}
                  </h2>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed italic line-clamp-2">
                    {event.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => toggleLike(event.id)}
                      className="flex items-center gap-2.5 group"
                    >
                      <Heart 
                        className={`transition-all duration-300 ${userLikes.includes(event.id) ? 'fill-pink-500 text-pink-500 scale-110' : 'text-zinc-500 group-hover:text-white'}`} 
                        size={24} 
                      />
                      <span className="text-[10px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase tracking-widest">
                         {userLikes.includes(event.id) ? 'Liked' : 'Like'}
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => toggleGoing(event.id)}
                      className="flex items-center gap-2.5 group"
                    >
                      <Users 
                        className={`transition-all duration-300 ${userGoing.includes(event.id) ? 'text-blue-400 scale-110' : 'text-zinc-500 group-hover:text-white'}`} 
                        size={24} 
                      />
                      <span className="text-[10px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase tracking-widest">
                         {goingCounts[event.id] || 0} Going
                      </span>
                    </button>

                    <button className="flex items-center gap-2.5 group">
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
          ))}

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
