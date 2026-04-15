'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { Heart, MapPin, Loader2, ChevronRight, ExternalLink } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  address?: string;
  image_url?: string;
  description?: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          clubs (
            id,
            name,
            address,
            image_url,
            description
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) {
        setFavorites(data.map((f: any) => f.clubs).filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <Loader2 className="animate-spin text-white/20" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative">
      <div className="pt-20 pb-8 px-6 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mb-1">Favorites</h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Your Saved Spots</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar">
        <div className="grid gap-4 pt-4">
          {favorites.length > 0 ? (
            favorites.map((club) => (
              <div 
                key={club.id} 
                className="w-full bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-white/10 transition-all"
              >
                <div 
                  onClick={() => router.push(`/map?select=${club.id}`)}
                  className="relative h-40 w-full bg-zinc-900 cursor-pointer overflow-hidden"
                >
                  {club.image_url ? (
                    <img src={club.image_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <Heart size={32} className="text-zinc-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-5 left-6">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg">{club.name}</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        <MapPin size={10} className="text-pink-500" />
                        {club.address || 'Cologne'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => router.push(`/map?select=${club.id}`)}
                      className="flex-1 bg-white/5 border border-white/5 text-white font-black py-4 rounded-3xl hover:bg-white/10 transition-all uppercase italic text-[10px] tracking-widest"
                    >
                      Show on Map
                    </button>
                    <button 
                      onClick={() => router.push(`/clubs/${club.id}`)}
                      className="flex-1 bg-white text-black font-black py-4 rounded-3xl hover:bg-zinc-200 transition-all uppercase italic text-[10px] tracking-widest"
                    >
                      See Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="mt-20 text-center px-12">
              <div className="inline-flex p-6 bg-zinc-900/50 rounded-full mb-6">
                 <Heart size={40} className="text-zinc-800" strokeWidth={1} />
              </div>
              <h3 className="text-white font-bold mb-2">No bookmarks yet</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Save your favorite clubs on the map to see them here later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
