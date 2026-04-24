'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Bell, Users, Music, Flame, Wallet } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/application/stores/authStore';
import { useHaptics } from '@/application/hooks/useHaptics';

const UNAUTH_SLIDES = [
  {
    title: "Discover Nightlife",
    description: "The best underground raves, techno clubs, and exclusive events curated for you.",
    image: "https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=1000",
    icon: <Map className="text-pink-500" size={32} />,
  },
  {
    title: "Meet the Vibe",
    description: "See where your friends are heading tonight and join the hottest spots.",
    image: "https://images.unsplash.com/photo-1541339907198-e08759df93f3?q=80&w=1000",
    icon: <Users className="text-blue-500" size={32} />,
  },
  {
    title: "Stay Notified",
    description: "Never miss a drop. Get notified when your favorite clubs announce events.",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000",
    icon: <Bell className="text-purple-500" size={32} />,
  },
];

const VIBES = ['Wild', 'Chill', 'Meet People', 'VIP', 'Underground'];
const GENRES = ['Techno', 'House', 'Hip Hop', 'D&B', 'Latin', 'Pop', 'Electronic'];
const BUDGETS = ['$', '$$', '$$$'];

export default function OnboardingOverlay() {
  const [show, setShow] = useState(false);
  const [isAuthMode, setIsAuthMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auth Setup State
  const [selectedVibe, setSelectedVibe] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { user, updateProfile, loading: authLoading } = useAuthStore();
  const haptics = useHaptics();

  useEffect(() => {
    if (authLoading) return;

    const hasSeenUnauth = localStorage.getItem('partySpot_onboarded');
    
    if (user) {
      // If user exists but hasn't set up their vibe/onboarding fields
      if (!user.vibe || !user.budget) {
        setIsAuthMode(true);
        setShow(true);
        setCurrentSlide(0);
      } else {
        setShow(false);
      }
    } else {
      // Unauthenticated visitor
      if (hasSeenUnauth !== 'true') {
        setIsAuthMode(false);
        setShow(true);
        setCurrentSlide(0);
      } else {
        setShow(false);
      }
    }
  }, [user, authLoading]);

  const nextSlide = async () => {
    haptics.trigger('light');
    if (isAuthMode) {
      if (currentSlide < 2) {
        setCurrentSlide(prev => prev + 1);
      } else {
        await finishAuthSetup();
      }
    } else {
      if (currentSlide < UNAUTH_SLIDES.length - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        completeUnauthOnboarding();
      }
    }
  };

  const completeUnauthOnboarding = () => {
    localStorage.setItem('partySpot_onboarded', 'true');
    setShow(false);
  };

  const finishAuthSetup = async () => {
    setIsSaving(true);
    haptics.trigger('medium');
    await updateProfile({
      vibe: selectedVibe || 'Wild',
      music_genres: selectedGenres,
      budget: selectedBudget || '$$',
      goal: 'party'
    });
    setIsSaving(false);
    setShow(false);
  };

  if (!show) return null;

  // Show a proper age gate first – button always visible, no spinner blocking
  if (!isAuthMode && currentSlide === 0) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black overflow-hidden flex flex-col">
        <div className="absolute inset-0 z-0">
          <Image
            src={UNAUTH_SLIDES[0].image}
            className="w-full h-full object-cover opacity-40"
            alt="Nightlife"
            fill
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between px-8 pt-16 pb-12 max-w-[430px] mx-auto w-full">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">Before you enter</p>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white leading-none">
              Ready to<br />Party?
            </h1>
            <p className="text-zinc-400 mt-4 font-medium text-sm leading-relaxed">
              PartySpot contains nightlife content. You must be 18+ to use this app.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setCurrentSlide(1)}
              className="w-full bg-white text-black font-black uppercase tracking-widest text-sm py-5 rounded-[2rem] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              I AM 18+ YEARS OLD →
            </button>
            <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
              PartySpot · Play Safe · Party Hard
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthMode) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col pt-20 px-6 pb-12">
        <div className="flex justify-between items-center mb-12">
           <div className="flex gap-2">
             {[0, 1, 2].map((step) => (
                <div key={step} className={`h-1.5 rounded-full transition-all duration-500 ${step <= currentSlide ? 'bg-pink-500 w-8' : 'bg-white/10 w-4'}`} />
             ))}
           </div>
           {currentSlide < 2 && <button onClick={() => setCurrentSlide(p => p + 1)} className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Skip</button>}
        </div>

        <AnimatePresence mode="wait">
          {currentSlide === 0 && (
            <motion.div key="step0" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <div className="w-16 h-16 bg-pink-500/10 rounded-3xl flex items-center justify-center mb-6 text-pink-500"><Flame size={32} /></div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">What&apos;s your vibe?</h1>
              <p className="text-zinc-400 font-medium mb-10 text-sm">This helps us match you with the right crowd.</p>
              <div className="flex flex-col gap-3">
                {VIBES.map(v => (
                  <button key={v} onClick={() => setSelectedVibe(v)} className={`p-5 rounded-3xl font-black uppercase text-sm italic tracking-widest transition-all border ${selectedVibe === v ? 'bg-pink-500 text-white border-pink-400' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentSlide === 1 && (
            <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 text-blue-500"><Music size={32} /></div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">Your Sound</h1>
              <p className="text-zinc-400 font-medium mb-10 text-sm">Select the music genres you love.</p>
              <div className="flex flex-wrap gap-3">
                {GENRES.map(g => {
                   const isSel = selectedGenres.includes(g);
                   return (
                    <button key={g} onClick={() => setSelectedGenres(p => isSel ? p.filter(x => x !== g) : [...p, g])} className={`px-6 py-4 rounded-full font-black uppercase text-xs tracking-widest transition-all border ${isSel ? 'bg-blue-500 text-white border-blue-400' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                      {g}
                    </button>
                   );
                })}
              </div>
            </motion.div>
          )}

          {currentSlide === 2 && (
            <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-6 text-purple-500"><Wallet size={32} /></div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">Night Budget</h1>
              <p className="text-zinc-400 font-medium mb-10 text-sm">How much are you planning to spend?</p>
              <div className="grid grid-cols-3 gap-3">
                {BUDGETS.map(b => (
                  <button key={b} onClick={() => setSelectedBudget(b)} className={`p-8 rounded-3xl font-black uppercase text-xl transition-all border flex items-center justify-center ${selectedBudget === b ? 'bg-purple-600 text-white border-purple-400' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={nextSlide} disabled={isSaving} className="w-full bg-white text-black font-black uppercase tracking-widest text-sm py-5 rounded-[2rem] active:scale-95 transition-transform flex justify-center items-center gap-2 mt-auto">
          {isSaving ? 'Saving...' : currentSlide === 2 ? 'Find My Vibe' : 'Continue'}
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // UNAUTHENTICATED PROMO TEMPLATES
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[10000] bg-black overflow-hidden flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.6, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image 
            src={UNAUTH_SLIDES[currentSlide].image} 
            className="w-full h-full object-cover" 
            alt="Nightlife Background" 
            fill
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 w-full h-full flex flex-col justify-end px-8 pb-20 max-w-[430px]">
        <motion.div
          key={currentSlide + '-content'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            {UNAUTH_SLIDES[currentSlide].icon}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none">
              {UNAUTH_SLIDES[currentSlide].title}
            </h1>
            <p className="text-zinc-400 font-medium leading-relaxed italic text-sm">
              {UNAUTH_SLIDES[currentSlide].description}
            </p>
          </div>

          <div className="flex gap-2 py-4">
            {UNAUTH_SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/20'
                }`} 
              />
            ))}
          </div>

          <button 
            onClick={nextSlide}
            className="w-full bg-white text-black font-black uppercase tracking-widest text-xs py-5 rounded-[2rem] shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 group"
          >
            {currentSlide === UNAUTH_SLIDES.length - 1 ? "Start Exploring" : "Next"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
