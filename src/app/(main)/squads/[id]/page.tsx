'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { useAuthStore } from '@/application/stores/authStore';
import { ChevronLeft, Users, MessageSquare, Rocket, Sunrise } from 'lucide-react';
import Image from 'next/image';
import { useHaptics } from '@/application/hooks/useHaptics';

function getSunriseCountdown(): string {
  const now = new Date();
  const sunrise = new Date();
  sunrise.setHours(6, 0, 0, 0);
  if (now >= sunrise) sunrise.setDate(sunrise.getDate() + 1);
  const diff = sunrise.getTime() - now.getTime();
  const h = Math.floor(diff / 1000 / 3600);
  const m = Math.floor((diff % (1000 * 3600)) / 60000);
  return `${h}h ${m}m`;
}

export default function SquadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const haptics = useHaptics();
  const [countdown, setCountdown] = useState(getSunriseCountdown());
  
  const [squad, setSquad] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchSquad();
  }, [params.id]);

  const fetchSquad = async () => {
    try {
      const { data, error } = await supabase
        .from('squads')
        .select(`
          *,
          events(title, clubs(name))
        `)
        .eq('id', params.id)
        .single();
      
      if (data) {
         setSquad(data);
         await fetchMembers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
     const { data } = await supabase
       .from('squad_members')
       .select(`
          user_id,
          profiles(username, avatar_url, vibe)
       `)
       .eq('squad_id', params.id);
     if (data) {
        setMembers(data);
     }
  };

  const handleJoin = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setJoining(true);
    haptics.trigger('medium');
    try {
      await supabase.from('squad_members').insert({
         squad_id: squad.id,
         user_id: user.id
      });
      fetchMembers();
      haptics.trigger('success');
    } catch (err) {
      console.error('Failed to join', err);
    } finally {
      setJoining(false);
    }
  };

  const isMember = members.some(m => m.user_id === user?.id);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" /></div>;
  }

  if (!squad) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Squad not found</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white px-6 pb-24 pt-16 flex flex-col selection:bg-blue-500/30">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => router.push('/feed')} className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900 border border-white/5 active:scale-90 transition-all">
          <ChevronLeft size={24} className="text-white" />
        </button>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto flex flex-col space-y-8">
        
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
            <Users size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            {squad.name}
          </h1>
          <p className="text-zinc-400 font-medium text-sm">
            Going to <span className="font-bold text-white">{squad.events?.title || 'a party'}</span>
          </p>
          {squad.vibe_required && (
            <div className="inline-block px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-300">
               Rule: {squad.vibe_required}
            </div>
          )}
        </div>

        {/* FOMO: Temporary Chat Banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 rounded-2xl shrink-0">
            <Sunrise size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-amber-300 font-black text-xs uppercase tracking-widest">This chat disappears at sunrise</p>
            <p className="text-amber-500/70 font-bold text-[10px] mt-0.5">Chat self-destructs in {countdown} — go out or miss out</p>
          </div>
        </div>

        <div className="pt-8 space-y-6">
          <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Members ({members.length})</h3>
          <div className="grid grid-cols-1 gap-3">
             {members.map(member => (
                <div key={member.user_id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-3xl flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                      <Image 
                        src={member.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${member.profiles?.username || 'U'}&background=18181b&color=fff`}
                        alt="Avatar"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                   </div>
                   <div>
                      <p className="font-bold text-sm">{member.profiles?.username || 'Anonymous Partygoer'}</p>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{member.profiles?.vibe || 'Mystery Vibe'}</p>
                   </div>
                </div>
             ))}
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pointer-events-none">
         <div className="max-w-lg mx-auto pointer-events-auto">
           {isMember ? (
              <button 
                className="w-full bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-sm py-5 rounded-[2rem] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <MessageSquare size={18} />
                Open Squad Chat
              </button>
           ) : (
              <button 
                onClick={handleJoin}
                disabled={joining}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm py-5 rounded-[2rem] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {joining ? 'Joining...' : 'Join Squad'}
                {!joining && <Rocket size={18} />}
              </button>
           )}
         </div>
      </div>
    </div>
  );
}
