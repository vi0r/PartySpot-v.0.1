'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Bookmark, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Event {
  id: string;
  title: string;
  description?: string;
  media_url?: string;
  is_official?: boolean;
  created_at: string;
  clubs?: {
    name: string;
    address?: string;
  };
}

export default function FeedPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch events with club info joined
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          clubs (
            name,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error fetching events:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-black min-h-full">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-zinc-900">
        <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">PartySpot</h1>
        <div className="flex gap-4">
          <Heart size={24} className="text-white" />
          <MessageCircle size={24} className="text-white" />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="animate-spin text-white mb-2" size={32} />
          <p className="text-zinc-500 text-xs">Fetching Cologne&apos;s highlights...</p>
        </div>
      )}

      {/* Feed List */}
      <div className="flex flex-col pb-20">
        {!loading && events.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No official events posted yet. Check back soon!</p>
          </div>
        )}

        {events.map((event) => (
          <article key={event.id} className="w-full border-b border-zinc-900 mb-4 bg-zinc-950">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {event.clubs?.name?.[0] || 'P'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {event.clubs?.name}
                    {event.is_official && (
                      <span className="bg-blue-500 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest">Official</span>
                    )}
                  </h3>
                  <div className="flex items-center text-[10px] text-zinc-500">
                    <MapPin size={10} className="mr-1" />
                    {event.clubs?.address || 'Cologne, Germany'}
                  </div>
                </div>
              </div>
              <MoreHorizontal size={20} className="text-zinc-500" />
            </div>

            {/* Media Content */}
            <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
              {event.media_url?.endsWith('.mp4') ? (
                <video 
                  src={event.media_url} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                />
              ) : (
                <img 
                  src={event.media_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=600&auto=format&fit=crop'} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>

            {/* Post Actions */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-4">
                  <Heart size={24} className="text-white hover:text-pink-500 transition-colors cursor-pointer" />
                  <MessageCircle size={24} className="text-white hover:text-blue-400 transition-colors cursor-pointer" />
                  <Share2 size={24} className="text-white hover:text-green-400 transition-colors cursor-pointer" />
                </div>
                <Bookmark size={24} className="text-white" />
              </div>
              
              {/* Post Details */}
              <div className="space-y-1">
                <p className="text-sm text-zinc-300">
                  <span className="font-bold text-white mr-2">{event.title}</span>
                  {event.description}
                </p>
                <p className="text-[10px] text-zinc-600 uppercase mt-2">
                  {new Date(event.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
