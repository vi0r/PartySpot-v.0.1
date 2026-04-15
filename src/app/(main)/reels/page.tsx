'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { supabase } from '@/infrastructure/services/supabase';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin, 
  Music2 as Music, 
  Loader2, 
  ChevronRight 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/application/stores/authStore';
import { useDataStore } from '@/application/stores/dataStore';

export default function ReelsPage() {
  const router = useRouter();
  
  // Store Hooks
  const { user, fetchUser } = useAuthStore();
  const { events, userLikes, fetchEvents, fetchUserLikes, toggleLike, loading } = useDataStore();

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      await fetchEvents();
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserLikes(user.id);
    }
  }, [user]);

  const handleLike = async (eventId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    await toggleLike(user.id, eventId);
  };

  const handleShare = async (e: any) => {
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
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="h-full w-full bg-zinc-900 animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black overflow-hidden relative">
      <Swiper
        direction="vertical"
        modules={[Pagination]}
        className="h-full w-full"
        pagination={{ clickable: true }}
      >
        {/* Static Header Overlay */}
        <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-50 pointer-events-none">
          <div className="bg-black/20 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5 pointer-events-auto">
             <h2 className="text-sm font-black text-white italic tracking-widest uppercase">PartySpot <span className="text-pink-500">Reels</span></h2>
          </div>
        </div>

        {events.map((event) => (
          <SwiperSlide key={event.id} className="h-full w-full relative">
            <div className="h-full w-full relative">
              <img 
                src={event.media_url || 'https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?q=80&w=800'} 
                alt={event.title} 
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
              
              {/* Interaction Sidebar */}
              <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center z-10">
                <div className="flex flex-col items-center gap-1 group">
                  <button 
                    onClick={() => handleLike(event.id)}
                    className={`p-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/5 transition-all active:scale-90 ${
                      userLikes.includes(event.id) ? 'text-pink-500' : 'text-white'
                    }`}
                  >
                    <Heart size={26} className={userLikes.includes(event.id) ? 'fill-pink-500' : ''} />
                  </button>
                  <span className="text-[10px] text-white font-bold opacity-70">
                    {userLikes.includes(event.id) ? '1' : '0'}
                  </span>
                </div>
                
                <div className="flex flex-col items-center gap-1 group">
                  <button className="p-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/5 text-white transition-all active:scale-90">
                    <MessageCircle size={26} />
                  </button>
                  <span className="text-[10px] text-white font-bold opacity-70">2</span>
                </div>

                <div className="flex flex-col items-center gap-1 group">
                  <button onClick={() => handleShare(event)} className="p-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/5 text-white transition-all active:scale-90">
                    <Share2 size={26} />
                  </button>
                </div>
              </div>

              {/* Event & Club Info (Bottom Overlay) */}
              <div className="absolute bottom-24 left-0 right-16 p-6 space-y-4">
                {/* Club Identity */}
                <button 
                  onClick={() => event.clubs?.id && router.push(`/clubs/${event.clubs.id}`)}
                  className="flex items-center gap-3 group transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl border-2 border-pink-500/50 p-0.5 overflow-hidden bg-black/20 backdrop-blur-3xl group-active:scale-95 transition-transform">
                    <img 
                      src={event.clubs?.image_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=100'} 
                      className="w-full h-full object-cover rounded-[0.9rem]"
                      alt={event.clubs?.name}
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase italic tracking-tight flex items-center gap-1">
                      {event.clubs?.name}
                      <ChevronRight size={14} className="text-pink-500 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                       <MapPin size={8} className="text-pink-500" /> {event.clubs?.address || 'Cologne'}
                    </span>
                  </div>
                </button>

                {/* Event Description */}
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-2xl">
                    {event.title}
                  </h3>
                  <p className="text-xs text-zinc-300 font-medium line-clamp-2 italic drop-shadow-lg pr-4">
                    {event.description}
                  </p>
                </div>

                {/* Music Track Marquee */}
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/5 px-3 py-2 rounded-full w-fit max-w-[200px] overflow-hidden group">
                  <Music size={14} className="text-pink-500 animate-pulse" />
                  <div className="flex whitespace-nowrap overflow-hidden">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest animate-marquee inline-block">
                      Original sound - {event.clubs?.name} Cologne Club
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
