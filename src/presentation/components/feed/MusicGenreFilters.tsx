'use client';

import React from 'react';
import { useUIStore } from '@/application/stores/uiStore';
import { useHaptics } from '@/application/hooks/useHaptics';

const GENRE_COLORS: Record<string, { bg: string, text: string, shadow: string }> = {
  'Techno': { bg: 'bg-purple-900/20', text: 'text-purple-400', shadow: 'shadow-purple-500/20' },
  'D&B': { bg: 'bg-red-900/20', text: 'text-red-400', shadow: 'shadow-red-500/20' },
  'House': { bg: 'bg-yellow-900/20', text: 'text-yellow-400', shadow: 'shadow-yellow-500/20' },
  'HIP HOP': { bg: 'bg-blue-900/20', text: 'text-blue-400', shadow: 'shadow-blue-500/20' },
  'LATIN': { bg: 'bg-orange-900/20', text: 'text-orange-400', shadow: 'shadow-orange-500/20' },
  'POP': { bg: 'bg-pink-900/20', text: 'text-pink-400', shadow: 'shadow-pink-500/20' },
  'ELECTRONIK': { bg: 'bg-teal-900/20', text: 'text-teal-400', shadow: 'shadow-teal-500/20' },
  'ROCK': { bg: 'bg-emerald-900/20', text: 'text-emerald-400', shadow: 'shadow-emerald-500/20' },
  'R&B': { bg: 'bg-indigo-900/20', text: 'text-indigo-400', shadow: 'shadow-indigo-500/20' },
  'EDM': { bg: 'bg-cyan-900/20', text: 'text-cyan-400', shadow: 'shadow-cyan-500/20' },
  'AFROBEATS': { bg: 'bg-lime-900/20', text: 'text-lime-400', shadow: 'shadow-lime-500/20' },
  'DUBSTEP': { bg: 'bg-violet-900/20', text: 'text-violet-400', shadow: 'shadow-violet-500/20' },
  'GARAGE': { bg: 'bg-rose-900/20', text: 'text-rose-400', shadow: 'shadow-rose-500/20' },
  'HARDSTYLE': { bg: 'bg-amber-900/20', text: 'text-amber-400', shadow: 'shadow-amber-500/20' },
};

export default function MusicGenreFilters() {
  const { feedActiveCategory, setFeedActiveCategory } = useUIStore();
  const haptics = useHaptics();

  const handleToggle = (genre: string) => {
    haptics.trigger('light');
    if (feedActiveCategory === genre) {
      setFeedActiveCategory('All');
    } else {
      setFeedActiveCategory(genre);
    }
  };

  return (
    <div className="px-6 mb-8 mt-2">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(GENRE_COLORS).map(([genre, colors]) => (
          <button
            key={genre}
            onClick={() => handleToggle(genre)}
            className={`py-5 px-6 rounded-3xl text-xs font-black uppercase tracking-[0.2em] transition-all border-2 ${
              feedActiveCategory === genre
                ? `bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.4)] scale-[0.98]`
                : `${colors.bg} ${colors.text} border-white/5 hover:border-white/20 shadow-xl ${colors.shadow}`
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}

