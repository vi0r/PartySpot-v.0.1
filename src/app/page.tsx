'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Loader2, PartyPopper } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Check if previously verified
    const verified = localStorage.getItem('age-verified');
    if (verified === 'true') {
      setIsVerified(true);
    }
    
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('age-verified', 'true');
      setIsVerified(true);
      setLoading(false);
    }, 800);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-black relative overflow-hidden text-center select-none">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)] animate-pulse" />
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay scale-110 animate-[pulse_8s_infinite]"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=1200")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className={`relative z-10 w-full flex flex-col items-center transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="mb-8 p-4 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl inline-flex items-center justify-center animate-bounce">
          <PartyPopper className="text-pink-500" size={32} />
        </div>

        <h1 className="text-7xl font-black italic tracking-tighter text-white mb-2 drop-shadow-2xl uppercase">
          PartySpot
        </h1>
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.3em] mb-12">
          Cologne Nightlife
        </p>

        {!isVerified ? (
          <div className="w-full max-w-sm bg-zinc-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <ShieldAlert className="mx-auto text-yellow-500 mb-6" size={40} />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tight">Access Restricted</h2>
            <p className="text-zinc-400 mb-10 text-xs leading-relaxed font-medium">
              This app contains nightlife content. You must be at least 18 years old to enter.
            </p>
            
            <button 
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  I AM 18+ YEARS OLD
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="mt-6 text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
              By entering you agree to our Terms
            </p>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="bg-zinc-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <h2 className="text-xl font-bold mb-8 text-white flex items-center justify-center gap-2 uppercase italic tracking-tight">
                Welcome to the Scene
              </h2>
              
              <div className="space-y-4">
                <Link 
                  href="/feed" 
                  className="w-full flex items-center justify-between bg-white text-black font-black py-5 px-8 rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] group"
                >
                  START EXPLORING
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/auth" 
                  className="w-full block bg-white/5 text-white font-bold py-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  LOG IN / SIGN UP
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 left-0 right-0 text-center text-[8px] text-zinc-800 uppercase tracking-[0.5em] font-black">
        PartySpot • Play Safe • Party Hard
      </div>
    </main>
  );
}
