'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { 
  ChevronLeft, UserPlus, UserCheck, MessageCircle, 
  Clock, Loader2, MapPin, Calendar, Sparkles, 
  Music, Trophy, Share2, Info
} from 'lucide-react';
import { useAuthStore } from '@/application/stores/authStore';
import { useHaptics } from '@/application/hooks/useHaptics';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const haptics = useHaptics();
  const { user: currentUser } = useAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [topClubs, setTopClubs] = useState<any[]>([]);

  useEffect(() => {
    if (id) fetchProfileData();
  }, [id, currentUser]);

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

      // 2. Fetch public plans
      const { data: goingData } = await supabase
        .from('event_going')
        .select('events(id, title, created_at, clubs(id, name, image_url))')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
        
      if (goingData) {
        const extractedPlans = goingData.map((g: any) => g.events).filter(Boolean);
        setPlans(extractedPlans);
        
        // Calculate Top Clubs purely for visual effect/history
        const clubsMap: Record<string, any> = {};
        extractedPlans.forEach((p: any) => {
          if (p.clubs) {
            clubsMap[p.clubs.id] = { ...p.clubs, count: (clubsMap[p.clubs.id]?.count || 0) + 1 };
          }
        });
        setTopClubs(Object.values(clubsMap).sort((a: any, b: any) => b.count - a.count).slice(0, 3));
      }

      // 3. Friend Status & Mutuals
      if (currentUser && currentUser.id !== id) {
        // Friend status
        const { data: friendData } = await supabase
          .from('friends')
          .select('status')
          .or(`and(user_id1.eq.${currentUser.id},user_id2.eq.${id}),and(user_id1.eq.${id},user_id2.eq.${currentUser.id})`)
          .maybeSingle();

        setFriendStatus(friendData?.status || 'none');
        
        // Mock mutual friends for now (social proof)
        const { data: friendsList } = await supabase.from('profiles').select('avatar_url, username').limit(3);
        if (friendsList) setMutualFriends(friendsList);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    haptics.trigger('medium');
    
    if (friendStatus === 'none') {
      const { error } = await supabase
        .from('friends')
        .insert({ user_id1: currentUser.id, user_id2: id, status: 'pending' });
      if (!error) {
        setFriendStatus('pending');
        haptics.trigger('success');
      }
    } else if (friendStatus === 'accepted') {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id1.eq.${currentUser.id},user_id2.eq.${id}),and(user_id1.eq.${id},user_id2.eq.${currentUser.id})`);
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
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">404 Vibe Not Found</h2>
        <button onClick={() => router.back()} className="px-8 py-3 bg-white/10 rounded-full font-black uppercase text-xs tracking-widest text-white border border-white/10">Go Back</button>
      </div>
    );
  }

  const isSelf = currentUser?.id === id;
  const username = profile.username || profile.email?.split('@')[0] || 'User';

  return (
    <div className="flex flex-col bg-background min-h-screen overflow-y-auto no-scrollbar pb-32">
      {/* IMMERSIVE HEADER */}
      <div className="relative pt-12 pb-12 px-6 text-center overflow-hidden">
        {/* Animated Neon Backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-gradient-to-b from-blue-600/20 via-blue-900/5 to-transparent blur-[80px]" />
        
        {/* Nav Bar */}
        <div className="absolute top-12 left-6 right-6 flex justify-between z-20">
          <button 
            onClick={() => router.back()} 
            className="p-3 bg-black/40 backdrop-blur-3xl rounded-2xl border border-white/10 text-white active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <button className="p-3 bg-black/40 backdrop-blur-3xl rounded-2xl border border-white/10 text-white active:scale-90 transition-all">
            <Share2 size={24} />
          </button>
        </div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative inline-block mt-12 mb-6"
        >
          {/* Main Avatar with Glow */}
          <div className="h-32 w-32 rounded-full bg-zinc-950 border-4 border-zinc-900 shadow-[0_0_60px_rgba(59,130,246,0.4)] overflow-hidden flex items-center justify-center text-4xl font-black text-white">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="opacity-40">{username[0].toUpperCase()}</span>
            )}
          </div>
          {/* Online/Activity Indicator */}
          <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background shadow-lg" />
        </motion.div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
            @{username}
          </h2>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-[0.2em] italic">
             {profile.bio || "Searching for the perfect beat"}
          </div>
        </div>

        {/* Action Buttons */}
        {!isSelf && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-10 flex items-center justify-center gap-3"
          >
            {friendStatus === 'accepted' ? (
              <>
                <button 
                  onClick={() => router.push(`/messages/${profile.id}`)}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-2xl"
                >
                  <MessageCircle size={18} /> Message
                </button>
                <button onClick={handleFriendAction} className="p-4 bg-zinc-900 text-white rounded-2xl border border-white/10 active:scale-95">
                  <UserCheck size={20} className="text-green-500" />
                </button>
              </>
            ) : friendStatus === 'pending' ? (
              <button disabled className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 text-zinc-500 font-black text-xs uppercase tracking-widest rounded-2xl border border-white/5">
                <Clock size={18} /> Request Pending
              </button>
            ) : (
              <button 
                onClick={handleFriendAction}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)]"
              >
                <UserPlus size={18} /> Add Friend
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* STATS STRIP */}
      <div className="px-6 grid grid-cols-2 gap-3 mb-10">
         <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-5 rounded-[2rem] flex items-center gap-4">
             <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
               <Trophy size={20} />
             </div>
             <div>
               <div className="text-white font-black text-xl italic tracking-tighter">LVL 08</div>
               <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Experience</div>
             </div>
         </div>
         <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-5 rounded-[2rem] flex items-center gap-4">
             <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
               <Sparkles size={20} />
             </div>
             <div>
               <div className="text-white font-black text-xl italic tracking-tighter">{mutualFriends.length > 0 ? mutualFriends.length + '+' : '0'}</div>
               <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Mutuals</div>
             </div>
         </div>
      </div>

      {/* DISCOVERY SECTIONS */}
      <div className="px-6 space-y-10">
        
        {/* THE VIBE SECTION */}
        <motion.section 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 bg-zinc-900/20 py-2">
            <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl">
              <Music size={18} />
            </div>
            <h3 className="text-white font-black uppercase italic tracking-tight text-lg leading-none pt-1">The Vibe</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile.music_genres || ['Techno', 'Electronic', 'Underground']).map((genre: string) => (
              <span key={genre} className="px-4 py-2.5 bg-zinc-900/60 border border-blue-500/20 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                {genre}
              </span>
            ))}
          </div>
        </motion.section>

        {/* TOP CLUBS SECTION */}
        {topClubs.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-white font-black uppercase italic tracking-tight text-lg italic">Frequents</h3>
               <div className="flex -space-x-3">
                 {topClubs.map((club, i) => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-zinc-800 overflow-hidden shadow-lg">
                      <img src={club.image_url || `https://ui-avatars.com/api/?name=${club.name}`} alt="" />
                   </div>
                 ))}
               </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
               {topClubs.map((club) => (
                 <div 
                   key={club.id}
                   onClick={() => router.push(`/clubs/${club.id}`)}
                   className="flex items-center justify-between p-5 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-[1.5rem] border border-white/5 group transition-all active:scale-95"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 overflow-hidden">
                       <img src={club.image_url || `https://ui-avatars.com/api/?name=${club.name}`} alt="" className="w-full h-full object-cover" />
                     </div>
                     <div className="text-left leading-none">
                       <span className="block text-white font-black italic uppercase tracking-tighter text-sm mb-1">{club.name}</span>
                       <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Regular Spot</span>
                     </div>
                   </div>
                   <ChevronLeft size={16} className="text-zinc-700 rotate-180 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* PUBLIC PLANS */}
        <section className="bg-zinc-900/50 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tight text-xl leading-none">Activity</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Confirmed Going</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {plans.length > 0 ? (
               plans.map((plan: any) => (
                <div key={plan.id} className="flex flex-col p-5 bg-black/40 rounded-[1.5rem] border border-white/5 gap-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-black text-white italic uppercase tracking-tight">{plan.title}</h4>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                       <MapPin size={12} className="text-pink-500" /> {plan.clubs?.name || 'Cologne'}
                    </div>
                    <span>Tonight</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-black/20 rounded-[1.5rem] border border-dashed border-white/5">
                <Info size={24} className="mx-auto text-zinc-800 mb-3" />
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">No public plans found</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* FOOTER PUSH */}
      <div className="mt-20 text-center opacity-20 pointer-events-none">
         <div className="text-[8px] font-black uppercase tracking-[0.6em] text-white">PartySpot ID: {profile.id.slice(0, 8)}</div>
      </div>
    </div>
  );
}
