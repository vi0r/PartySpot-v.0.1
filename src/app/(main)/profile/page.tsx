'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { LogOut, Settings, Heart, ShieldCheck, MapPin, Loader2, ChevronRight, X, ExternalLink, AlertCircle, Calendar, Bell, QrCode } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  address?: string;
  image_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [favorites, setFavorites] = useState<Club[]>([]);
  const [myPlans, setMyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Auth Error:', authError);
        router.push('/auth');
        return;
      }
      
      setUser(authUser);

      // Check Admin Status
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      
      if (profile) {
        setIsAdmin(profile.is_admin);
        if (!profile.is_admin) setDebugInfo('is_admin is FALSE in database');
      }

      // Fetch Favorites
      const { data: favs } = await supabase
        .from('favorites')
        .select('clubs(id, name, address, image_url)')
        .eq('user_id', authUser.id);

      if (favs) {
        const clubData = favs.map((f: any) => f.clubs).filter(Boolean);
        setFavorites(clubData);
      }

      // Fetch "My Plans" (Going Events)
      const { data: goingData } = await supabase
        .from('event_going')
        .select('events(id, title, created_at, clubs(name))')
        .eq('user_id', authUser.id);
      
      if (goingData) {
        const plans = goingData.map((g: any) => g.events).filter(Boolean);
        setMyPlans(plans);
      }
    } catch (error) {
      console.error('General Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePush = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.active) {
          registration.active.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            title: 'PartySpot Reminder',
            options: {
              body: 'Your event starts in 2 hours! Get ready!',
            },
            delay: 5000
          });
          alert('Notifications enabled! A test reminder will arrive in 5 seconds.');
        } else {
          alert('Service worker not active. Please reload.');
        }
      } else {
        alert('Please enable notifications in your browser settings.');
      }
    } else {
      alert('Your browser does not support push notifications.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background">
        <Loader2 className="animate-spin text-white mb-2" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto no-scrollbar pb-24">
      {/* Header Profile Section */}
      <div className="relative pt-16 pb-8 px-6 text-center">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        
        <div className="relative inline-block mb-4">
          <div className="h-24 w-24 rounded-full bg-zinc-900 border-2 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center text-3xl font-black text-white p-1">
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
          </div>
          {isAdmin && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full border-4 border-black shadow-lg">
              <ShieldCheck size={16} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
            {user?.email?.split('@')[0] || 'User'}
          </h2>
          <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
             Cologne, Germany
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* My Plans / Calendar Section */}
        <section className="bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-2xl">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tight">Мои Планы</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Event Calendar</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {myPlans.length > 0 ? (
              myPlans.map((plan: any) => (
                <button 
                  key={plan.id} 
                  onClick={() => setSelectedTicket(plan)}
                  className="w-full text-left flex flex-col p-4 bg-black/40 hover:bg-white/5 transition-all active:scale-95 rounded-2xl border border-white/5 gap-2 group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500/50 group-hover:bg-blue-400 transition-colors" />
                  <div className="flex justify-between items-start pr-4">
                    <h4 className="text-sm font-bold text-white leading-tight line-clamp-1">{plan.title}</h4>
                    <span className="shrink-0 bg-white/10 text-white text-[9px] px-2 py-1 rounded-full uppercase tracking-wider font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      Билет
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                    <MapPin size={10} /> {plan.clubs?.name || 'Cologne'}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Нет запланированных событий</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-3">
            <button onClick={handleEnablePush} className="shrink-0 mt-0.5 group">
              <Bell size={14} className="text-yellow-500 group-active:scale-95 transition-transform" />
            </button>
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
              *Push-напоминания (вибрация и уведомление) за 2 часа до старта вечеринки автоматически активируются через настройки. {' '}
              <button onClick={handleEnablePush} className="text-yellow-500 font-bold uppercase tracking-wider hover:underline ml-1">
                Протестировать Push
              </button>
            </p>
          </div>
        </section>

        {/* Action Menu */}
        <div className="space-y-3">
          <button 
            onClick={() => router.push('/favorites')}
            className="flex items-center justify-between w-full p-5 bg-zinc-900/50 backdrop-blur-md rounded-3xl text-white font-bold hover:bg-zinc-800 transition-all border border-white/5 group shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-pink-500/10 rounded-2xl text-pink-500">
                <Heart size={20} />
              </div>
              <div className="text-left">
                <span className="block text-sm">Saved Favorites</span>
                <span className="block text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Quick access</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-between w-full p-5 bg-black/40 rounded-3xl text-white font-bold hover:bg-zinc-900 transition-all border border-white/5 shadow-lg group"
          >
            <div className="flex items-center gap-4">
              <Settings size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
              <span className="text-sm">Account Settings</span>
            </div>
            <ChevronRight size={18} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <div className="mt-auto pt-8 pb-8 text-center text-[8px] text-zinc-800 uppercase tracking-[0.4em] font-black">
        PartySpot • Cologne Nightlife
      </div>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-background animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between p-6 pt-16 border-b border-white/5 bg-black/40 backdrop-blur-3xl relative z-10 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-2xl">
                <Settings size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Settings</h2>
            </div>
            <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors active:scale-90">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 space-y-8 overflow-y-auto h-full pb-32">
            <section className="space-y-4">
              <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-2">Account</h3>
              <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <span className="text-sm font-bold text-white">Email</span>
                    <span className="text-xs text-zinc-400 font-medium">{user?.email}</span>
                </div>
                <button className="w-full text-left p-5 border-b border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-colors flex justify-between items-center">
                    Change Password <ChevronRight size={14} className="text-zinc-600" />
                </button>
                <button className="w-full text-left p-5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors flex justify-between items-center">
                    Delete Account <AlertCircle size={14} />
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-2">Preferences</h3>
              <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden p-2 shadow-2xl">
                <button 
                  onClick={handleEnablePush} 
                  className="w-full flex justify-between items-center p-4 hover:bg-white/5 rounded-2xl transition-colors active:scale-95"
                >
                  <span className="text-sm font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-xl">
                      <Bell size={16} className="text-pink-500" />
                    </div>
                    Push Notifications
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-pink-500 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full">
                    Setup
                  </span>
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-2">Support & Legal</h3>
              <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                 <button className="w-full text-left p-5 border-b border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-colors flex justify-between items-center group">
                    Contact Us <ExternalLink size={14} className="text-zinc-600 group-hover:text-white transition-colors" />
                 </button>
                 <button className="w-full text-left p-5 border-b border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-colors flex justify-between items-center group">
                    Privacy Policy <ExternalLink size={14} className="text-zinc-600 group-hover:text-white transition-colors" />
                 </button>
              </div>
            </section>

            <button 
              onClick={handleLogout}
              className="w-full mt-4 bg-red-500/5 text-red-500 font-black uppercase tracking-wider text-xs py-5 rounded-3xl border border-red-500/20 active:scale-95 transition-all shadow-2xl hover:bg-red-500/10 flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Ticket Modal Overlay */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            {/* Holographic Header */}
            <div className="relative h-28 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-between px-8 z-10 border-b border-white/10">
               <div className="text-white">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">VIP PASS</h2>
                 <p className="text-[9px] font-black tracking-widest text-white/80">PARTYSPOT GUESTLIST</p>
               </div>
               <button onClick={() => setSelectedTicket(null)} className="p-3 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-all active:scale-95 border border-white/10">
                 <X size={20} />
               </button>
            </div>
            
            {/* Main Ticket Info */}
            <div className="px-8 pt-8 pb-10 text-center relative bg-zinc-900/50">
               <h3 className="text-xl font-black text-white italic tracking-tight mb-2 line-clamp-2 leading-tight">{selectedTicket.title}</h3>
               <p className="text-pink-500 font-bold text-[10px] uppercase tracking-widest mb-8 flex items-center justify-center gap-1.5">
                 <MapPin size={12} />
                 {selectedTicket.clubs?.name || 'Cologne'}
               </p>

               {/* Mock QR Code Container */}
               <div className="bg-white/95 p-6 rounded-[2rem] inline-block mb-10 shadow-2xl shadow-blue-500/20 ring-4 ring-white/10">
                 <QrCode size={180} strokeWidth={1.5} className="text-black" />
               </div>

               {/* Ticket Details */}
               <div className="grid grid-cols-3 gap-4 text-left pt-6 font-mono border-t border-white/10 border-dashed relative">
                 {/* Decorative Cutouts */}
                 <div className="absolute -top-3 -left-12 w-6 h-6 bg-black rounded-full border-r border-white/10"></div>
                 <div className="absolute -top-3 -right-12 w-6 h-6 bg-black rounded-full border-l border-white/10"></div>

                 <div>
                   <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Date</p>
                   <p className="text-white font-bold text-sm tracking-tight">TONIGHT</p>
                 </div>
                 <div className="text-center">
                   <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Entry</p>
                   <p className="text-white font-bold text-sm tracking-tight">REGULAR</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Admit</p>
                   <p className="text-white font-bold text-sm tracking-tight">1</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
