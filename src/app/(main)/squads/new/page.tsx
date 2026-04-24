'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { useAuthStore } from '@/application/stores/authStore';
import { ChevronLeft, Users, ShieldAlert, Rocket } from 'lucide-react';
import { useHaptics } from '@/application/hooks/useHaptics';

function SquadNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');
  
  const { user } = useAuthStore();
  const haptics = useHaptics();
  
  const [squadName, setSquadName] = useState('');
  const [vibeReq, setVibeReq] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!eventId) {
      setError('Event ID is missing. Go back and select a party.');
      return;
    }
    if (squadName.trim().length < 3) {
      setError('Squad name is too short (min 3 chars).');
      return;
    }

    setLoading(true);
    setError('');
    haptics.trigger('medium');

    try {
      const { data, error: insertError } = await supabase
        .from('squads')
        .insert({
          event_id: eventId,
          creator_id: user.id,
          name: squadName.trim(),
          vibe_required: vibeReq.trim() || 'All vibes welcome'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Automatically join the squad creator to squad_members
      if (data) {
        await supabase.from('squad_members').insert({
          squad_id: data.id,
          user_id: user.id
        });
        haptics.trigger('success');
        router.push(`/squads/${data.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create squad. Did you run the SQL migration?');
      haptics.trigger('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white px-6 pb-12 pt-16 flex flex-col selection:bg-blue-500/30">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900 border border-white/5 active:scale-90 transition-all">
          <ChevronLeft size={24} className="text-white" />
        </button>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto flex flex-col justify-center space-y-8">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Users size={40} />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            Form your<br />Squad
          </h1>
          <p className="text-zinc-400 font-medium text-sm max-w-[280px]">
            Create a temporary group chat for tonight's party and let others join you.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3">
             <ShieldAlert size={20} className="shrink-0 mt-0.5" />
             <span className="text-xs font-bold uppercase tracking-widest leading-relaxed">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-4 mb-2 block">Squad Name</label>
            <input 
              type="text" 
              maxLength={30}
              value={squadName}
              onChange={e => setSquadName(e.target.value)}
              placeholder="e.g. Techno Lovers"
              className="w-full bg-zinc-900 border border-white/10 rounded-[2rem] px-6 py-5 text-white font-bold placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-4 mb-2 block">Vibe Required (Optional)</label>
            <input 
              type="text" 
              maxLength={40}
              value={vibeReq}
              onChange={e => setVibeReq(e.target.value)}
              placeholder="e.g. Only chill people"
              className="w-full bg-zinc-900 border border-white/10 rounded-[2rem] px-6 py-5 text-white font-bold placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>

        <div className="pt-8">
          <button 
            onClick={handleCreate} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm py-5 rounded-[2rem] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Squad'}
            {!loading && <Rocket size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SquadNewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" /></div>}>
      <SquadNewContent />
    </Suspense>
  );
}
