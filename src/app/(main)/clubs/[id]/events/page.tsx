'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { ChevronLeft, Calendar, Heart, Share2, Loader2, MapPin } from 'lucide-react';
import { useDataStore } from '@/application/stores/dataStore';
import { useAuthStore } from '@/application/stores/authStore';

export default function ClubEventsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { userLikes, toggleLike } = useDataStore();

  const [club, setClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: clubData }, { data: eventsData }] = await Promise.all([
        supabase.from('clubs').select('*').eq('id', id).single(),
        supabase
          .from('events')
          .select('*, clubs(id, name, address, image_url)')
          .eq('club_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (clubData) setClub(clubData);
      if (eventsData) setEvents(eventsData);
    } catch (e) {
      console.error('Error fetching club events:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (eventId: string) => {
    if (!user) { router.push('/auth'); return; }
    await toggleLike(user.id, eventId);
  };

  const handleShare = async (event: any) => {
    const url = `${window.location.origin}/clubs/${id}`;
    if (navigator.share) {
      await navigator.share({ title: event.title, text: `Check out ${event.title}!`, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-2xl border-b border-white/5 px-5 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-zinc-900 border border-white/5 rounded-full active:scale-95 transition-transform text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none truncate">
            {club?.name}
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        {club?.image_url && (
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
            <img src={club.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Events Feed */}
      <div className="px-5 pt-6 space-y-5">
        {events.length > 0 ? (
          events.map((event) => {
            const isLiked = userLikes.includes(event.id);
            return (
              <div
                key={event.id}
                className="bg-zinc-900/50 border border-white/5 rounded-[2rem] overflow-hidden"
              >
                {/* Event Image */}
                <div className="relative h-52 w-full">
                  <img
                    src={event.media_url || 'https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?q=80&w=800'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Date pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <Calendar size={10} className="text-pink-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Tonight</span>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleLike(event.id)}
                      className={`p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-90 ${
                        isLiked ? 'bg-pink-500/20 text-pink-500' : 'bg-black/40 text-white'
                      }`}
                    >
                      <Heart size={16} className={isLiked ? 'fill-pink-500' : ''} />
                    </button>
                    <button
                      onClick={() => handleShare(event)}
                      className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-90 transition-all"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-5 space-y-3">
                  <div>
                    <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-tight">
                      {event.title}
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium mt-1.5 leading-relaxed line-clamp-3">
                      {event.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    <MapPin size={10} className="text-pink-500" />
                    {club?.address || 'Cologne, Germany'}
                  </div>

                  <button
                    onClick={() => router.push(`/clubs/${id}`)}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all active:scale-[0.98]"
                  >
                    View Club Profile
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-24 space-y-4">
            <div className="text-5xl">🎵</div>
            <h3 className="text-white font-black italic uppercase tracking-tighter text-xl">
              No Events Yet
            </h3>
            <p className="text-zinc-500 text-xs font-medium max-w-[200px] mx-auto leading-relaxed">
              {club?.name} hasn't posted any events. Check back soon!
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full active:scale-95 transition-all"
            >
              Back to Club
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
