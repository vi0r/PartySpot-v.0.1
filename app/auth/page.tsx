'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      setMessage('Check your email for the confirmation link!');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-black relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full pointer-events-none" />

      <Link href="/" className="z-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 text-sm font-medium">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="relative z-10">
        <h1 className="text-4xl font-black italic tracking-tighter text-white mb-2 uppercase">
          Welcome back
        </h1>
        <p className="text-zinc-500 text-sm mb-10">
          Enter your details to join the party.
        </p>

        <form className="space-y-4">
          <div>
            <input 
              type="email" 
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-all"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 text-emerald-500 text-xs p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <AlertCircle size={14} />
              {message}
            </div>
          )}

          <div className="pt-4 space-y-3">
            <button 
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </button>
            <button 
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-zinc-800/50 text-white font-bold py-4 rounded-2xl border border-white/10 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>

      <div className="mt-auto pb-8 text-center">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
          PartySpot Cologne • Built for the Night
        </p>
      </div>
    </div>
  );
}
