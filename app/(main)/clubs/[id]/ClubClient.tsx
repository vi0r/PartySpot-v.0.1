'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, MapPin, Heart, Share2, Calendar, Loader2 } from 'lucide-react';

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
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClubDetails();
    }
  }, [id]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch Club Info
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clubError) throw clubError;
      setClub(clubData);

      // Fetch upcoming events for this club
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('club_id', id)
        .order('created_at', { ascending: false });
      
      setEvents(eventsData || []);

      // Check if favorite
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favData } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
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

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

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
            <button className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-white active:scale-95 transition-all">
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
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl leading-none">
            {club.name}
          </h1>
          <div className="flex items-center gap-2 text-zinc-400 mt-2 font-bold text-[10px] uppercase tracking-widest">
            <MapPin size={12} className="text-pink-500" />
            {club.address || 'Cologne, Germany'}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-8 space-y-10">
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">About the Venue</h3>
          <p className="text-zinc-400 text-sm leading-relaxed font-medium">
            {club.description || "The premier electronic music destination in Cologne. Experience top-tier sound systems and local residents' favorite hideouts."}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Entry Age</span>
              <span className="text-white font-black italic uppercase tracking-tighter">18+ Only</span>
           </div>
           <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Vibe Check</span>
              <span className="text-white font-black italic uppercase tracking-tighter">Underground</span>
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
                  <div className="flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2 text-pink-500 text-[9px] font-bold uppercase tracking-widest mb-1">
                      <Calendar size={10} /> TONIGHT
                    </div>
                    <h4 className="text-sm font-black text-white uppercase italic tracking-tight">{event.title}</h4>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{event.description || 'Global residents and surprise guests.'}</p>
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

      <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
        <div className="max-w-[430px] mx-auto pointer-events-auto">
          <button className="w-full bg-white text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-white/10 hover:bg-zinc-200 transition-all active:scale-[0.98] uppercase tracking-tighter italic text-lg">
            Get tickets
          </button>
        </div>
      </div>
    </div>
  );
}
