'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { ChevronLeft, UserPlus, UserCheck, MessageCircle, Clock, Loader2, MapPin, Calendar } from 'lucide-react';
import { useAuthStore } from '@/application/stores/authStore';

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<string | null>(null); // 'none', 'pending', 'accepted'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProfileData();
  }, [id, user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Profile
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profError || !prof) throw new Error('User not found');
      setProfile(prof);

      // 2. Fetch public plans (Going)
      const { data: goingData } = await supabase
        .from('event_going')
        .select('events(id, title, created_at, clubs(id, name))')
        .eq('user_id', id);
        
      if (goingData) {
        setPlans(goingData.map((g: any) => g.events).filter(Boolean));
      }

      // 3. Fetch Friend Status if logged in
      if (user && user.id !== id) {
        const { data: friendData } = await supabase
          .from('friends')
          .select('status')
          .or(`and(user_id1.eq.${user.id},user_id2.eq.${id}),and(user_id1.eq.${id},user_id2.eq.${user.id})`)
          .maybeSingle();

        if (friendData) {
          setFriendStatus(friendData.status);
        } else {
          setFriendStatus('none');
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (friendStatus === 'none') {
      // Send request
      const { error } = await supabase
        .from('friends')
        .insert({ user_id1: user.id, user_id2: id, status: 'pending' });
      
      if (!error) setFriendStatus('pending');
    } else if (friendStatus === 'accepted') {
      // Unfriend
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id1.eq.${user.id},user_id2.eq.${id}),and(user_id1.eq.${id},user_id2.eq.${user.id})`);
      
      if (!error) setFriendStatus('none');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6 text-center">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">User Not Found</h2>
        <button onClick={() => router.back()} className="px-6 py-3 bg-white/10 rounded-full font-bold uppercase text-xs">Go Back</button>
      </div>
    );
  }

  const isSelf = user?.id === id;

  return (
    <div className="flex flex-col bg-background min-h-screen overflow-y-auto no-scrollbar pb-32">
      {/* Header Profile Section */}
      <div className="relative pt-12 pb-8 px-6 text-center">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
        
        {/* Nav Bar */}
        <div className="absolute top-12 left-6 right-6 flex justify-between z-10">
          <button onClick={() => router.back()} className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-white active:scale-95 transition-all">
            <ChevronLeft size={24} />
          </button>
        </div>
        
        <div className="relative inline-block mt-8 mb-4">
          <div className="h-28 w-28 rounded-full bg-zinc-900 border-4 border-black shadow-[0_0_40px_rgba(59,130,246,0.3)] overflow-hidden flex items-center justify-center text-4xl font-black text-white p-1">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
            @{profile.username || profile.email?.split('@')[0] || 'User'}
          </h2>
          <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
             {profile.bio || "Nightlife Enthusiast"}
          </div>
        </div>

        {/* Action Buttons */}
        {!isSelf && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {friendStatus === 'accepted' ? (
              <>
                <button 
                  onClick={() => router.push(`/messages/${profile.id}`)}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-full active:scale-95 hover:bg-blue-400 transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                >
                  <MessageCircle size={16} /> Message
                </button>
                <button onClick={handleFriendAction} className="p-3.5 bg-white/10 text-white rounded-full active:scale-95 border border-white/5">
                  <UserCheck size={18} className="text-green-400" />
                </button>
              </>
            ) : friendStatus === 'pending' ? (
              <button disabled className="flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-widest rounded-full border border-white/5">
                <Clock size={16} /> Request Sent
              </button>
            ) : (
              <button 
                onClick={handleFriendAction}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full active:scale-95 hover:bg-zinc-200 transition-all shadow-xl"
              >
                <UserPlus size={16} /> Add Friend
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-6 space-y-6 mt-4">
        {/* Public Plans Section */}
        <section className="bg-zinc-900/50 backdrop-blur-md rounded-[2rem] border border-white/5 p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-2xl">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tight">Going To</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Public Plans</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {plans.length > 0 ? (
               plans.map((plan: any) => (
                <div key={plan.id} onClick={() => router.push(`/clubs/${plan.clubs?.id}`)} className="cursor-pointer flex flex-col p-4 bg-black/40 hover:bg-white/5 rounded-2xl border border-white/5 gap-2 transition-colors">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-white leading-tight">{plan.title}</h4>
                    <span className="shrink-0 text-zinc-500 text-[9px] font-bold uppercase tracking-widest">
                       Tonight
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium font-mono">
                    <MapPin size={10} className="text-blue-500" /> {plan.clubs?.name || 'Cologne'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-black/20 rounded-2xl border border-dashed border-white/5">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">No plans visible</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
