'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { Music } from 'lucide-react';

interface ClubStory {
  id: string;
  name: string;
  image_url?: string;
  hasUpdates: boolean;
}

export default function VinylStories() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubStory[]>([]);
  const [hoveredClub, setHoveredClub] = useState<string | null>(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    const { data } = await supabase
      .from('clubs')
      .select('id, name, image_url')
      .limit(10);
      
    if (data) {
      // Simulate that some have "new" story updates for the glowing ring effect
      setClubs(data.map(c => ({ ...c, hasUpdates: Math.random() > 0.3 })));
    }
  };

  if (clubs.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes flyUpAndFade {
          0% { transform: translateY(0) scale(0.8) rotate(0deg); opacity: 0; }
          20% { opacity: 1; transform: translateY(-5px) scale(1) rotate(-10deg); }
          80% { opacity: 1; transform: translateY(-25px) scale(1.2) rotate(15deg); }
          100% { transform: translateY(-35px) scale(1) rotate(20deg); opacity: 0; }
        }
        .animate-fly-up {
          animation: flyUpAndFade 1.5s infinite linear;
        }
        .animate-fly-up-delay {
          animation: flyUpAndFade 2s infinite linear 0.7s;
        }
      `}</style>
      <div className="w-full pt-4 pb-6 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex gap-5 px-6 items-center">
          {clubs.map((club) => (
            <div 
              key={club.id} 
              className="flex flex-col items-center gap-3 relative group cursor-pointer shrink-0"
              onClick={() => {
                  const haptics = (window as unknown as { __haptics?: { trigger: (s: string) => void } }).__haptics;
                  if (haptics) haptics.trigger('light');
                 router.push(`/clubs/${club.id}`);
              }}
              onMouseEnter={() => setHoveredClub(club.id)}
              onMouseLeave={() => setHoveredClub(null)}
              onTouchStart={() => setHoveredClub(club.id)}
              onTouchEnd={() => setHoveredClub(null)}
              onTouchCancel={() => setHoveredClub(null)}
            >
              {/* Outline Ring (Story Status) */}
              <div className={`p-0.5 rounded-full ${club.hasUpdates ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500' : 'bg-zinc-800'}`}>
                
                {/* Vinyl Record */}
                <div className={`w-[76px] h-[76px] rounded-full bg-zinc-950 border-[4px] border-zinc-900 shadow-2xl relative overflow-hidden flex items-center justify-center transition-all duration-300 ${hoveredClub === club.id ? 'animate-[spin_1.5s_linear_infinite]' : 'animate-[spin_5s_linear_infinite]'}`}>
                  
                  {/* Vinyl Grooves (Decorative Rings) */}
                  <div className="absolute inset-[6px] border border-white/5 rounded-full pointer-events-none" />
                  <div className="absolute inset-[12px] border border-white/5 rounded-full pointer-events-none" />
                  <div className="absolute inset-[18px] border border-white/5 rounded-full pointer-events-none" />
                  
                  {/* Club Avatar (Inner Record Label) */}
                  <div className="w-7 h-7 rounded-full overflow-hidden z-10 border border-white/20">
                    {club.image_url ? (
                      <img 
                        src={club.image_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <span className="text-[10px] font-black text-white">{club.name[0]}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Center Hole */}
                  <div className="absolute w-1.5 h-1.5 bg-black rounded-full z-20 pointer-events-none" />
                  
                  {/* Glossy reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 pointer-events-none" />
                </div>
              </div>
              
              {/* Club Name */}
              <span className={`text-[9px] font-bold uppercase tracking-widest truncate w-16 text-center transition-colors ${hoveredClub === club.id ? 'text-white' : 'text-zinc-400'}`}>
                {club.name}
              </span>

              {/* Dancing Music Notes (Shown on Hover/Touch) */}
              {hoveredClub === club.id && (
                <div className="absolute -top-4 w-full h-full pointer-events-none z-50">
                  <Music size={22} className="text-zinc-400 absolute top-0 -left-2 animate-fly-up drop-shadow-[0_0_8px_rgba(161,161,170,0.8)]" />
                  <Music size={18} className="text-zinc-300 absolute top-3 -right-2 animate-fly-up-delay drop-shadow-[0_0_8px_rgba(212,212,216,0.8)]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
