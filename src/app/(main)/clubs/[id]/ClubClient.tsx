'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { ChevronLeft, MapPin, Heart, Share2, Calendar, Loader2 } from 'lucide-react';
import { StarRating } from '@/presentation/components/ui/StarRating';
import { useAuthStore } from '@/application/stores/authStore';

interface Club {
  id: string;
  name: string;
  description?: string;
  address?: string;
  image_url?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  media_url?: string;
  created_at: string;
}

export default function ClubClient() {
  const { id } = useParams();
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventRatings, setEventRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchUser();
    if (id) {
      fetchClubDetails();
    }
  }, [id]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clubError) throw clubError;
      setClub(clubData);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('club_id', id)
        .order('created_at', { ascending: false });
      
      const evs = eventsData || [];
      setEvents(evs);

      // Fetch user's ratings for these events
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && evs.length > 0) {
        const eventIds = evs.map(e => e.id);
        const { data: ratingsData } = await supabase
          .from('event_ratings')
          .select('event_id, rating')
          .eq('user_id', currentUser.id)
          .in('event_id', eventIds);
        
        if (ratingsData) {
          const rMap: Record<string, number> = {};
          ratingsData.forEach(r => rMap[r.event_id] = r.rating);
          setEventRatings(rMap);
        }

        const { data: favData } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('club_id', id)
          .maybeSingle();
        
        setIsFavorite(!!favData);
      }
    } catch (error) {
      console.error('Error fetching club details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async (eventId: string, rating: number) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_ratings')
        .upsert({ 
          event_id: eventId, 
          user_id: user.id, 
          rating 
        }, { onConflict: 'event_id,user_id' });

      if (!error) {
        setEventRatings(prev => ({ ...prev, [eventId]: rating }));
      }
    } catch (err) {
      console.error('Error saving rating:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      if (isFavorite) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('club_id', id);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, club_id: id });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    if (!club) return;
    const title = club.name;
    const text = `Check out ${club.name} on PartySpot!`;
    const url = window.location.href;
    
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
      <div className="flex flex-col items-center justify-center h-full bg-black min-h-screen">
        <Loader2 className="animate-spin text-white mb-2" size={32} />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black min-h-screen text-white p-12 text-center">
        <h2 className="text-xl font-bold mb-4">Venue not found</h2>
        <button onClick={() => router.back()} className="text-pink-500 font-bold uppercase tracking-widest text-xs">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto no-scrollbar pb-32 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[45vh] w-full shrink-0">
        <img 
          src={club.image_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=1200'} 
          className="w-full h-full object-cover" 
          alt={club.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        {/* Upper Controls */}
        <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-10">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-white active:scale-95 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-white active:scale-95 transition-all"
            >
              <Share2 size={22} />
            </button>
            <button 
              onClick={toggleFavorite}
              className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-white active:scale-95 transition-all"
            >
              <Heart size={22} className={isFavorite ? 'text-pink-500 fill-pink-500' : ''} />
            </button>
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-8 left-6 right-6">
          
          {/* Live Status Pill */}
          <div className="mb-3 inline-flex bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30 items-center gap-2 animate-pulse shadow-2xl">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
             <span className="text-[9px] font-black uppercase tracking-widest text-white">Live: Fast Queue 🚶</span>
          </div>

          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl leading-none">
            {club.name}
          </h1>
          <div className="flex items-center gap-2 text-zinc-400 mt-2 font-bold text-[10px] uppercase tracking-widest">
            <button 
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(club.name + ' ' + (club.address || 'Cologne, Germany'))}`, '_blank')}
              className="flex items-center gap-1 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
            >
              <MapPin size={12} className="text-pink-500" />
              {club.address || 'Cologne, Germany'}
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-8 space-y-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">About the Venue</h3>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed font-medium">
            {club.description || "The premier electronic music destination in Cologne. Experience top-tier sound systems and local residents' favorite hideouts."}
          </p>
          <a 
            href={`https://instagram.com`} 
            target="_blank" 
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all active:scale-95"
          >
            Instagram
          </a>
        </section>

        <section className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Entry Age</span>
              <span className="text-white font-black italic uppercase tracking-tighter">18+ Only</span>
           </div>
           <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Music Focus</span>
              <span className="text-white font-black italic uppercase tracking-tighter">Techno & House</span>
           </div>
           <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Dress Code</span>
              <span className="text-white font-black italic uppercase tracking-tighter">All Black / Kinky</span>
           </div>
           <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Door Policy</span>
              <span className="text-white font-black italic uppercase tracking-tighter">Strict</span>
           </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Upcoming Events</h3>
            <button className="text-[9px] font-black text-pink-500 uppercase tracking-widest">View All</button>
          </div>

          <div className="space-y-3">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="flex gap-4 p-4 bg-zinc-950 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                  <div className="w-20 h-20 rounded-xl bg-zinc-900 overflow-hidden shrink-0">
                    <img src={event.media_url || 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                  <div className="flex flex-col justify-center gap-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-pink-500 text-[9px] font-bold uppercase tracking-widest mb-1">
                        <Calendar size={10} /> TONIGHT
                      </div>
                      <StarRating 
                        initialRating={eventRatings[event.id] || 0} 
                        onRatingChange={(r) => handleRatingChange(event.id, r)}
                      />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase italic tracking-tight">{event.title}</h4>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{event.description || 'Global residents and surprise guests.'}</p>
                    
                    {/* Social Proof Avatars */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                           <div key={i} className="w-5 h-5 rounded-full border-2 border-black bg-zinc-800 overflow-hidden shrink-0">
                             <img src={`https://i.pravatar.cc/100?img=${(i * 12) + parseInt(event.id.replace(/\D/g, '').substring(0, 2) || '1')}`} alt="" className="w-full h-full object-cover"/>
                           </div>
                        ))}
                      </div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">+ {Math.floor(Math.random() * 50) + 12} going</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-zinc-700 bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-white/5">
                 <p className="text-[10px] font-bold uppercase tracking-widest">No events scheduled this week</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed bottom-24 left-0 right-0 p-6 pointer-events-none z-50">
        <div className="max-w-[430px] mx-auto pointer-events-auto">
          <button className="w-full bg-white text-black font-black py-4 rounded-[2rem] shadow-2xl shadow-white/10 hover:bg-zinc-200 transition-all active:scale-[0.98] uppercase tracking-tighter italic text-sm">
            Get tickets
          </button>
        </div>
      </div>
    </div>
  );
}
