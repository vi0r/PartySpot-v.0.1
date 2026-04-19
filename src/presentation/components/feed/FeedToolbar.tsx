'use client';

import React from 'react';
import { Search, MapPin } from 'lucide-react';
import { useUIStore } from '@/application/stores/uiStore';
import { useDataStore } from '@/application/stores/dataStore';

const CATEGORIES = ['All', 'Techno', 'House', 'Hip Hop', 'D&B', 'Latin', 'Pop', 'Bar', 'Electronic'];

export default function FeedToolbar() {
  const { 
    feedSearchQuery, 
    setFeedSearchQuery, 
    feedActiveCategory, 
    setFeedActiveCategory, 
    isFeedFilterOpen, 
    setFeedFilterOpen 
  } = useUIStore();
  
  const { userLocation, requestLocation } = useDataStore();

  return (
    <div className="w-full px-4 pb-4 space-y-3">
      {isFeedFilterOpen && (
        <div className="bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in slide-in-from-bottom-4 duration-300 shadow-2xl">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFeedActiveCategory(cat);
                setFeedFilterOpen(false);
              }}
              className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                feedActiveCategory === cat 
                  ? 'bg-white text-black border-white shadow-lg' 
                  : 'bg-black/40 text-zinc-500 border-white/5 hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 bg-zinc-900/95 backdrop-blur-3xl border border-white/10 p-4 rounded-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pink-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search clubs, vibes..."
              value={feedSearchQuery}
              onChange={(e) => setFeedSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white placeholder-zinc-700 focus:border-white/20 transition-all outline-none text-xs font-bold"
            />
          </div>
          
          <button 
            onClick={() => setFeedFilterOpen(!isFeedFilterOpen)}
            className={`px-5 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
              feedActiveCategory !== 'All' || isFeedFilterOpen
                ? 'bg-white text-black border-white' 
                : 'bg-black/40 text-zinc-400 border-white/5'
            }`}
          >
            {feedActiveCategory}
            <div className={`w-1.5 h-1.5 rounded-full ${isFeedFilterOpen ? 'bg-pink-500' : 'bg-zinc-700'}`} />
          </button>
        </div>

        <button 
          onClick={requestLocation}
          className={`w-full py-4 px-6 rounded-2xl border flex items-center justify-center gap-2 transition-all active:scale-95 ${
            userLocation 
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase italic' 
              : 'bg-white text-black border-white shadow-lg text-[10px] font-black uppercase italic'
          }`}
        >
          <MapPin size={16} />
          {userLocation ? 'Location Active' : 'Find Clubs Near Me'}
        </button>
      </div>
    </div>
  );
}
