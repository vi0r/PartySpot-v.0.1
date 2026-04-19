'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Users, MessageCircle, ShieldAlert, Loader2, PartyPopper, Zap, Music } from 'lucide-react';
import { useAuthStore } from '@/application/stores/authStore';

const SLIDES = [
  {
    id: 'hero',
    icon: PartyPopper,
    iconColor: 'text-pink-500',
    bg: 'from-pink-900/30 via-purple-900/20 to-black',
    tag: 'COLOGNE NIGHTLIFE',
    title: 'PartySpot',
    desc: 'Your gateway to the best clubs, events, and people in the city. Every night, rediscovered.',
    image: 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=1200',
  },
  {
    id: 'features',
    icon: Zap,
    iconColor: 'text-yellow-500',
    bg: 'from-blue-900/30 via-purple-900/20 to-black',
    tag: 'EVERYTHING IN ONE PLACE',
    title: 'Your Night.\nYour Way.',
    desc: null,
    image: 'https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?q=80&w=1200',
    features: [
      { icon: MapPin, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Discover Clubs', desc: 'Find the best spots on the map' },
      { icon: Music, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Reels', desc: 'See what\'s going down tonight' },
      { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Who\'s Going', desc: 'See your friends at events' },
      { icon: MessageCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Chat', desc: 'Plan the night together' },
    ],
  },
  {
    id: 'age-gate',
    icon: ShieldAlert,
    iconColor: 'text-yellow-500',
    bg: 'from-zinc-900/60 via-black to-black',
    tag: 'BEFORE YOU ENTER',
    title: 'Ready to\nParty?',
    desc: 'PartySpot contains nightlife content. You must be 18+ to use this app.',
    image: 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?q=80&w=1200',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const { user, loading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/feed');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const isVerified = localStorage.getItem('age-verified') === 'true';
    setAlreadyVerified(isVerified);
    if (isVerified) {
      setVerified(true);
      setSlide(2); // skip to action slide
    }
    setTimeout(() => setShowContent(true), 80);
  }, []);

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      localStorage.setItem('age-verified', 'true');
      setVerified(true);
      setVerifying(false);
    }, 600);
  };

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <main className="flex min-h-[100dvh] flex-col bg-black relative overflow-hidden select-none">
      {/* Background Image */}
      <div
        key={current.id}
        className="absolute inset-0 z-0 transition-opacity duration-700"
      >
        <div
          className="absolute inset-0 opacity-30 mix-blend-luminosity"
          style={{
            backgroundImage: `url("${current.image}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${current.bg}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Content */}
      <div className={`relative z-10 flex flex-col h-[100dvh] px-7 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Top Tag */}
        <div className="pt-[calc(env(safe-area-inset-top,48px)+2rem)] pb-4">
          <span className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">{current.tag}</span>
        </div>

        {/* Main Copy */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Title */}
            <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none mb-5 whitespace-pre-line drop-shadow-2xl">
              {current.title}
            </h1>

            {/* Description or Features */}
            {current.desc && (
              <p className="text-sm text-zinc-400 font-medium leading-relaxed max-w-xs">
                {current.desc}
              </p>
            )}

            {current.features && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {current.features.map((f) => {
                  const FIcon = f.icon;
                  return (
                    <div key={f.label} className={`${f.bg} border border-white/5 rounded-3xl p-4 space-y-2`}>
                      <FIcon size={20} className={f.color} />
                      <p className="text-white font-black text-sm">{f.label}</p>
                      <p className="text-zinc-500 text-[10px] font-medium leading-tight">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom CTAs */}
          <div className="pb-[calc(env(safe-area-inset-bottom,32px)+2rem)] space-y-4">
            {/* Dots */}
            {!alreadyVerified && (
              <div className="flex items-center justify-center gap-2 mb-6">
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === slide ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Slide 0: Next */}
            {slide === 0 && (
              <button
                onClick={() => setSlide(1)}
                className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all group"
              >
                Explore <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Slide 1: Features — Next */}
            {slide === 1 && (
              <button
                onClick={() => setSlide(2)}
                className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all group"
              >
                Let's Go <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Slide 2: Age Gate + Final CTAs */}
            {slide === 2 && !verified && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {verifying ? <Loader2 className="animate-spin" size={20} /> : <>I AM 18+ YEARS OLD <ArrowRight size={18} /></>}
              </button>
            )}

            {(slide === 2 && verified && !user && !authLoading) && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link
                  href="/auth"
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-black py-5 rounded-2xl active:scale-[0.98] transition-all group"
                >
                  LOG IN / SIGN UP <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
            
            {(slide === 2 && verified && authLoading) && (
              <div className="flex justify-center py-4">
                 <Loader2 className="animate-spin text-white" size={24} />
              </div>
            )}

            {/* Skip on slides 0 and 1 */}
            {slide < 2 && (
              <button
                onClick={() => setSlide(2)}
                className="w-full text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest py-2"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Branding */}
      <div 
        className="absolute left-0 right-0 text-center z-10 pointer-events-none"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <p className="text-[8px] text-zinc-800 uppercase tracking-[0.5em] font-black">
          PartySpot • Play Safe • Party Hard
        </p>
      </div>
    </main>
  );
}
