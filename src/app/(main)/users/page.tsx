'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infrastructure/services/supabase';
import { Search, Loader2, ChevronLeft, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '@/application/stores/authStore';

export default function UserSearchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularUsers, setPopularUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchPopularUsers();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchPopularUsers = async () => {
    // Just fetch some random users to show before searching
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url, bio')
      .limit(5);
      
    if (data) {
      // Don't show ourselves
      setPopularUsers(data.filter(p => p.id !== user?.id));
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, bio')
        .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      
      // Filter out self
      if (data) {
        setResults(data.filter(p => p.id !== user?.id));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen pt-12 px-6 pb-24 overflow-y-auto no-scrollbar">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-3 bg-zinc-900 border border-white/5 rounded-full active:scale-95 transition-transform text-white">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
            Find Friends
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Discover ravers</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="relative group mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pink-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className="w-full bg-zinc-900/80 border border-pink-500/20 rounded-[2rem] p-5 pl-14 text-white placeholder-zinc-600 focus:border-pink-500/50 focus:bg-zinc-900 transition-all outline-none text-sm font-medium shadow-[0_0_20px_rgba(236,72,153,0.05)]"
        />
        {loading && (
          <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-pink-500 animate-spin" size={20} />
        )}
      </div>

      <div className="space-y-4">
        {searchQuery.trim().length >= 2 ? (
          // Search Results
          <>
            <div className="flex items-center gap-2 mb-4">
              <Search size={16} className="text-pink-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Search Results</h3>
            </div>
            
            {results.length > 0 ? (
              results.map(profile => (
                <div 
                  key={profile.id}
                  onClick={() => router.push(`/users/${profile.id}`)}
                  className="flex justify-between items-center p-4 bg-zinc-900/40 hover:bg-zinc-800 border border-white/5 rounded-3xl cursor-pointer active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-white font-black group-hover:border-pink-500/50 transition-colors">
                       {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile.username?.[0]?.toUpperCase() || 'U')}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base leading-tight group-hover:text-pink-400 transition-colors">
                        @{profile.username || profile.email?.split('@')[0]}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-medium mt-1 line-clamp-1">
                        {profile.bio || 'PartySpot User'}
                      </p>
                    </div>
                  </div>
                  <UserPlus size={18} className="text-zinc-600 group-hover:text-white transition-colors group-hover:scale-110" />
                </div>
              ))
            ) : (
              !loading && (
                <div className="text-center py-16 bg-black/40 border border-dashed border-white/10 rounded-3xl">
                  <p className="text-sm font-bold text-white mb-1">Nobody found</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Try another username</p>
                </div>
              )
            )}
          </>
        ) : (
          // Suggestions (when no search query)
          <>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-blue-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Discover People</h3>
            </div>
            {popularUsers.map(profile => (
              <div 
                key={profile.id}
                onClick={() => router.push(`/users/${profile.id}`)}
                className="flex justify-between items-center p-4 bg-zinc-900/40 hover:bg-zinc-800 border border-white/5 rounded-3xl cursor-pointer active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-white font-black group-hover:border-blue-500/50 transition-colors">
                     {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile.username?.[0]?.toUpperCase() || 'U')}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base leading-tight group-hover:text-blue-400 transition-colors">
                      @{profile.username || profile.email?.split('@')[0]}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1 line-clamp-1">
                      {profile.bio || 'Recently Active'}
                    </p>
                  </div>
                </div>
                <UserPlus size={18} className="text-zinc-600 group-hover:text-white transition-colors group-hover:scale-110" />
              </div>
            ))}
          </>
        )}
      </div>

    </div>
  );
}
