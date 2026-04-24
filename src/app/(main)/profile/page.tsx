'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { 
  LogOut, Settings, Heart, ShieldCheck, MapPin, Loader2, 
  ChevronRight, X, ExternalLink, AlertCircle, Calendar, 
  Bell, QrCode, Layout, PanelLeft, Edit2, Camera, Check, 
  Share2, Sparkles, Trophy, Music
} from 'lucide-react';
import { useUIStore } from '@/application/stores/uiStore';
import { useAuthStore } from '@/application/stores/authStore';
import { useHaptics } from '@/application/hooks/useHaptics';
import { motion, AnimatePresence } from 'framer-motion';

const MUSIC_GENRES = ['Techno', 'House', 'Hip Hop', 'D&B', 'Latin', 'Pop', 'Electronic', 'Rock', 'Jazz'];

interface Club {
  id: string;
  name: string;
  address?: string;
  image_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const haptics = useHaptics();
  const { user, updateProfile, loading: authLoading } = useAuthStore();
  const { navStyle, setNavStyle, dockSide, setDockSide } = useUIStore();
  
  const [favorites, setFavorites] = useState<Club[]>([]);
  const [myPlans, setMyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);

  // Friend states
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [showFriends, setShowFriends] = useState(false);
  
  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with store when user data loads/updates
  useEffect(() => {
    if (user) {
      setEditedUsername(user.username || '');
      setEditedBio(user.bio || '');
      setSelectedGenres(user.music_genres || []);
      fetchProfileData();
    }
  }, [user?.id, user?.username, user?.bio, user?.music_genres]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Fetch Favorites
      const { data: favs } = await supabase
        .from('favorites')
        .select('clubs(id, name, address, image_url)')
        .eq('user_id', user.id);

      if (favs) {
        setFavorites(favs.map((f: any) => f.clubs).filter(Boolean));
      }

      // Fetch "My Plans"
      const { data: goingData } = await supabase
        .from('event_going')
        .select('events(id, title, created_at, clubs(id, name))') // Added clubs(id) for navigation
        .eq('user_id', user.id);
      
      if (goingData) {
        setMyPlans(goingData.map((g: any) => g.events).filter(Boolean));
      }

      // Fetch Friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select(`
          status,
          user_id1 (id, username, email, avatar_url),
          user_id2 (id, username, email, avatar_url)
        `)
        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

      if (friendsData) {
        const acceptedFriends = friendsData
          .filter((f: any) => f.status === 'accepted')
          .map((f: any) => {
            const friend = f.user_id1.id === user.id ? f.user_id2 : f.user_id1;
            return friend;
          })
          .filter(Boolean);
        setFriendsList(acceptedFriends);
      }
    } catch (error) {
      console.error('Profile Data Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    haptics.trigger('medium');
    
    console.log('Attempting Save:', { username: editedUsername, bio: editedBio, music_genres: selectedGenres });

    const { error } = await updateProfile({
      username: editedUsername,
      bio: editedBio,
      music_genres: selectedGenres
    });
    
    if (error) {
      console.error('Save failed:', error);
      alert(`Save failed: ${error.message || 'Unknown error'}`);
    } else {
      setIsEditing(false);
      haptics.trigger('success');
    }
    setIsSaving(false);
  };

  const toggleGenre = (genre: string) => {
    haptics.trigger('light');
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background">
        <Loader2 className="animate-spin text-white mb-2" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center p-1 mb-8 shadow-2xl">
          <div className="w-full h-full bg-black rounded-full flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-white/5" />
             <span className="text-4xl font-black text-white italic">P</span>
          </div>
        </div>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-3">Your Profile</h2>
        <p className="text-zinc-500 text-sm font-medium mb-10 max-w-[280px] leading-relaxed">
          Log in or create an account to customize your profile, set your music vibes, and keep track of your parties.
        </p>
        <button 
          onClick={() => router.push('/auth')} 
          className="w-full max-w-[250px] bg-white text-black font-black uppercase text-[10px] tracking-widest py-4 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto overflow-x-hidden no-scrollbar pb-40">
      {/* 
          1. DECORATIVE BACKGROUND 
          Strictly background - will not interfere with layout
      */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative z-10 flex flex-col pt-32 px-6">
        
        {/* TOP BUTTONS - Settings & QR */}
        <div className="absolute top-16 right-6 flex gap-3 z-30">
          <button 
            onClick={() => { haptics.trigger('light'); setShowQR(true); }}
            className="p-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-white active:scale-90 transition-all shadow-2xl"
          >
            <QrCode size={20} />
          </button>
          <button 
            onClick={() => { haptics.trigger('light'); setShowSettings(true); }}
            className="p-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-white active:scale-90 transition-all shadow-2xl"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* 2. HERO SECTION (Avatar & Info) */}
        <div className="flex flex-col items-center text-center mb-10 w-full">
          {/* AVATAR */}
          <div className="relative mb-8 pt-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-36 w-36 rounded-full p-1.5 bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 shadow-[0_0_50px_rgba(168,85,247,0.3)]"
            >
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden border-[6px] border-zinc-950">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black text-white">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
            </motion.div>
            <button className="absolute bottom-1 right-1 p-3 bg-white text-black rounded-full shadow-2xl border-4 border-zinc-950 active:scale-90 transition-all">
              <Camera size={18} />
            </button>
          </div>

          {/* IDENTITY */}
          <div className="w-full max-w-sm">
            {isEditing ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <input 
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-center text-white font-bold outline-none focus:border-purple-500 shadow-inner"
                />
                <textarea 
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="Tell us your vibe..."
                  rows={2}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-center text-white text-sm outline-none focus:border-purple-500 resize-none shadow-inner"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 bg-white/5 text-zinc-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 py-4 bg-purple-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} 
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 px-4 w-full">
                <div className="space-y-3">
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center justify-center gap-4">
                    @{user?.username || 'user'}
                    <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 rounded-full text-zinc-600 hover:text-white transition-all">
                      <Edit2 size={16} />
                    </button>
                  </h2>
                  <p className="text-zinc-400 text-base font-medium leading-relaxed italic">
                    {user?.bio || "Exploring Cologne's best beats."}
                  </p>
                </div>
                
                {/* TONIGHT STATUS TOGGLE */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-2 flex">
                    {['Chilling', 'Going Out', 'Looking for Squad'].map((status) => (
                      <button 
                        key={status}
                        onClick={() => updateProfile({ tonight_status: status })}
                        className={`flex-1 py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                           (user?.tonight_status || 'Chilling') === status 
                             ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white' 
                             : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                         {status === 'Chilling' && '🛌 '}
                         {status === 'Going Out' && '🔥 '}
                         {status === 'Looking for Squad' && '👀 '}
                         {status}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. SOCIAL STATS GRID - Now naturally flows below the text */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {/* FRIENDS BUTTON */}
          <button 
            onClick={() => { haptics.trigger('light'); setShowFriends(true); }}
            className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 p-4 rounded-3xl text-center flex flex-col items-center gap-1.5 shadow-xl transition-all active:scale-95 hover:bg-white/5"
          >
            <div className="text-blue-400 p-1.5 bg-white/5 rounded-xl"><Sparkles size={14} /></div>
            <div className="text-white font-black text-xl italic leading-none tracking-tighter">{friendsList.length}</div>
            <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Friends</div>
          </button>
          
          <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 p-4 rounded-3xl text-center flex flex-col items-center gap-1.5 shadow-xl">
            <div className="text-purple-400 p-1.5 bg-white/5 rounded-xl"><Trophy size={14} /></div>
            <div className="text-white font-black text-xl italic leading-none tracking-tighter">Lvl 14</div>
            <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Hype</div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 p-4 rounded-3xl text-center flex flex-col items-center gap-1.5 shadow-xl">
             <div className="text-pink-400 p-1.5 bg-white/5 rounded-xl"><Music size={14} /></div>
             <div className="text-white font-black text-xl italic leading-none tracking-tighter">{myPlans.length}</div>
             <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Attended</div>
          </div>
        </div>

        {/* 4. CONTENT SECTIONS */}
        <div className="space-y-12">
          
          {/* MY VIBE SECTION */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl italic">My Vibe</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Musical Identity</p>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
                <Music size={22} />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {MUSIC_GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                    selectedGenres.includes(genre)
                      ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-zinc-900/60 border-white/5 text-zinc-600'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>

          {/* MY PLANS SECTION */}
          <section className="bg-zinc-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-2xl">
                  <Calendar size={26} />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase italic tracking-tight text-2xl italic">Календарь</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Ready for tonight</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {myPlans.length > 0 ? (
                myPlans.map((plan: any) => (
                  <button 
                    key={plan.id} 
                    onClick={() => { haptics.trigger('light'); setSelectedTicket(plan); }}
                    className="w-full flex items-center justify-between p-5 bg-black/40 hover:bg-white/5 rounded-3xl border border-white/5 transition-all group"
                  >
                    <div className="text-left">
                      <h4 className="text-base font-black text-white italic uppercase tracking-tighter mb-1">{plan.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={10} className="text-pink-500" /> {plan.clubs?.name || 'Cologne'}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                  </button>
                ))
              ) : (
                <div className="text-center py-12 bg-black/20 rounded-[1.5rem] border border-dashed border-white/10">
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">No plans yet</p>
                  <button onClick={() => router.push('/feed')} className="mt-4 px-6 py-2 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Discover Now</button>
                </div>
              )}
            </div>
          </section>

          {/* FAVORITES LINK */}
          <button 
            onClick={() => router.push('/favorites')}
            className="flex items-center justify-between w-full p-7 bg-zinc-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 group shadow-2xl transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
               <div className="p-4 bg-pink-500/10 rounded-2xl text-pink-500 group-hover:scale-110 transition-transform">
                 <Heart size={28} fill={favorites.length > 0 ? "currentColor" : "none"} />
               </div>
               <div className="text-left">
                 <span className="block text-xl font-black italic uppercase tracking-tighter text-white">My Favorites</span>
                 <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{favorites.length} Clubs Saved</span>
               </div>
            </div>
            <ChevronRight size={24} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-24 pb-12 text-center selection:bg-pink-500/30">
        <div className="text-[8px] text-white/20 font-black uppercase tracking-[0.8em] mb-2">PartySpot ID: {user?.id?.slice(0, 8)}</div>
        <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em] italic">POWERED BY VI0R</div>
      </div>

      {/* OVERLAY MODALS (SETTINGS, QR, TICKET, FRIENDS) */}
      <AnimatePresence>
        {showFriends && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between p-6 pt-16 border-b border-white/5 bg-black/40 backdrop-blur-3xl relative z-10 transition-transform">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-blue-400" />
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Friends</h2>
              </div>
              <button 
                onClick={() => setShowFriends(false)} 
                className="p-3 bg-white/5 rounded-full text-white active:scale-90 transition-all font-bold"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto pb-32">
              <div className="space-y-3">
                {friendsList.length > 0 ? (
                  friendsList.map((friend) => (
                    <div 
                      key={friend.id}
                      onClick={() => router.push(`/users/${friend.id}`)}
                      className="flex justify-between items-center p-4 bg-zinc-900/40 hover:bg-zinc-800 border border-white/5 rounded-3xl cursor-pointer active:scale-[0.98] transition-all group shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-white font-black shadow-inner">
                           {friend.avatar_url ? <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> : (friend.username?.[0]?.toUpperCase() || 'U')}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base leading-tight group-hover:text-blue-400 transition-colors">
                            {friend.username || friend.email?.split('@')[0] || 'Friend'}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                            Tap to view profile
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-zinc-700 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 shadow-xl">
                      <Sparkles className="text-zinc-500" size={24} />
                    </div>
                    <p className="text-white font-black uppercase text-lg italic mb-2 tracking-tighter">No friends yet</p>
                    <p className="text-zinc-500 text-xs font-medium max-w-[200px] mx-auto">Add people to see them listed here.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between p-6 pt-16 border-b border-white/5 bg-black/40 backdrop-blur-3xl relative z-10">
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-white" />
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-full text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-6 space-y-8 overflow-y-auto pb-32">
              <section className="space-y-4">
                <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-2">App Configuration</h3>
                <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden p-2 shadow-2xl">
                  <div className="p-4 flex justify-between items-center">
                      <span className="text-sm font-bold text-white flex items-center gap-3 pl-1">
                          <div className="p-2 bg-blue-500/10 rounded-xl">
                              <PanelLeft size={16} className="text-blue-500" />
                          </div>
                          Dock Side
                      </span>
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                          <button 
                              onClick={() => { haptics.trigger('light'); setDockSide('left'); }}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dockSide === 'left' ? 'bg-white text-black' : 'text-zinc-500'}`}
                          >
                              Left
                          </button>
                          <button 
                              onClick={() => { haptics.trigger('light'); setDockSide('right'); }}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dockSide === 'right' ? 'bg-white text-black' : 'text-zinc-500'}`}
                          >
                              Right
                          </button>
                      </div>
                  </div>
                </div>
              </section>

              <button 
                onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
                className="w-full bg-red-500/5 text-red-500 font-black uppercase tracking-wider text-xs py-5 rounded-3xl border border-red-500/20 active:scale-95 flex items-center justify-center gap-2 shadow-2xl"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[3rem] p-10 text-center relative shadow-2xl"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 p-2 text-zinc-500"><X size={24} /></button>
              <div className="mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 mx-auto p-1 mb-4">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span className="text-2xl font-black text-white">U</span>}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">@{user?.username || 'user'}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] inline-block mb-10 shadow-2xl"><QrCode size={200} strokeWidth={1.5} className="text-black" /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative"
            >
              <div className="relative h-32 bg-gradient-to-br from-blue-600 to-pink-600 flex items-center justify-between px-10 z-10 border-b border-white/10">
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">VIP PASS</h2>
                 <button onClick={() => setSelectedTicket(null)} className="p-3 bg-black/20 rounded-full text-white"><X size={20} /></button>
              </div>
              <div className="px-10 pt-10 pb-12 text-center bg-zinc-900/50">
                 <h3 className="text-2xl font-black text-white italic tracking-tight mb-4 leading-tight">{selectedTicket.title}</h3>
                 <div className="bg-white p-8 rounded-[2.5rem] inline-block mb-10 shadow-2xl"><QrCode size={180} strokeWidth={1.5} className="text-black" /></div>
                 <div className="grid grid-cols-2 gap-8 text-left pt-8 font-mono border-t border-white/10 border-dashed relative">
                    <div className="absolute -top-3.5 -left-14 w-7 h-7 bg-zinc-950 rounded-full border border-white/10" />
                    <div className="absolute -top-3.5 -right-14 w-7 h-7 bg-zinc-950 rounded-full border border-white/10" />
                    <div><p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Date</p><p className="text-white font-bold text-base">TONIGHT</p></div>
                    <div className="text-right"><p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Pass</p><p className="text-white font-bold text-base">1 PERSON</p></div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
