'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, Settings, Heart, ShieldCheck, MapPin, Loader2, ChevronRight, X, ExternalLink, AlertCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [showFavsModal, setShowFavsModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

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
      console.log('Current User ID:', authUser.id);

      // Check Admin Status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Profile Fetch Error:', profileError);
        setDebugInfo(`DB Error: ${profileError.message}`);
      } else if (!profile) {
        console.warn('No profile found for this user ID in "profiles" table.');
        setDebugInfo('Profile not found in database');
      } else {
        console.log('Profile Data found:', profile);
        setIsAdmin(profile.is_admin);
        if (!profile.is_admin) setDebugInfo('is_admin is FALSE in database');
      }

      // Fetch Favorites with Club details
      const { data: favs, error: favsError } = await supabase
        .from('favorites')
        .select(`
          clubs (
            id,
            name,
            address,
            image_url
          )
        `)
        .eq('user_id', authUser.id);

      if (favsError) console.error('Favorites Error:', favsError);

      if (favs) {
        const clubData = favs.map((f: any) => f.clubs).filter(Boolean);
        setFavorites(clubData);
      }
    } catch (error) {
      console.error('General Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black">
        <Loader2 className="animate-spin text-white mb-2" size={32} />
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto no-scrollbar pb-24">
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
            {isAdmin && <ShieldCheck size={18} className="text-blue-500" />}
          </h2>
          <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
            <MapPin size={10} /> Cologne, Germany
          </div>
        </div>
      </div>

      {/* Admin Warning for Debug */}
      {debugInfo && !isAdmin && (
        <div className="mx-6 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle size={16} className="text-yellow-500 shrink-0" />
          <p className="text-[10px] text-yellow-200/70 font-medium">
            Admin Debug: {debugInfo}. Если в базе стоит TRUE, попробуй перезайти.
          </p>
        </div>
      )}

      {/* Action Menu */}
      <div className="px-6 space-y-3 mt-4">
        <button 
          onClick={() => router.push('/favorites')}
          className="flex items-center justify-between w-full p-5 bg-zinc-900/50 backdrop-blur-md rounded-[2rem] text-white font-bold hover:bg-zinc-800 transition-all border border-white/5 group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-pink-500/10 rounded-xl text-pink-500">
              <Heart size={20} />
            </div>
            <div className="text-left">
              <span className="block text-sm">Saved Favorites</span>
              <span className="block text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Quick access</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
        </button>

        <button className="flex items-center gap-4 w-full p-5 bg-black/40 rounded-[2rem] text-white font-bold hover:bg-zinc-900 transition-all border border-white/5">
          <Settings size={20} className="text-zinc-500" />
          <span className="text-sm">Account Settings</span>
        </button>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 w-full p-5 bg-black/40 rounded-[2rem] text-red-500 font-bold hover:bg-red-500/10 transition-all border border-red-500/5 mt-8"
        >
          <LogOut size={20} />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>

      <div className="mt-auto pb-8 text-center text-[8px] text-zinc-800 uppercase tracking-[0.4em] font-black">
        PartySpot • Cologne Nightlife
      </div>
    </div>
  );
}
