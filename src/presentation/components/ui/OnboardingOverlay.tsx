'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, CalendarHeart, Share2, Bell, Users } from 'lucide-react';
import Image from 'next/image';

const SLIDES = [
  {
    title: "Discover Nightlife",
    description: "The best underground raves, techno clubs, and exclusive events curated for Cologne.",
    image: "https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=1000",
    icon: <Map className="text-pink-500" size={32} />,
  },
  {
    title: "Meet the Vibe",
    description: "See where your friends are heading tonight and join the hottest spots in the city.",
    image: "https://images.unsplash.com/photo-1541339907198-e08759df93f3?q=80&w=1000",
    icon: <Users className="text-blue-500" size={32} />,
  },
  {
    title: "Stay Notified",
    description: "Never miss a drop. Get notified when your favorite clubs announce new events.",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000",
    icon: <Bell className="text-purple-500" size={32} />,
  },
];

export default function OnboardingOverlay() {
  const [show, setShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('partySpot_onboarded');
    if (hasSeen !== 'true') {
      setShow(true);
    }
  }, []);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('partySpot_onboarded', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* Background Images */}
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
            src={SLIDES[currentSlide].image} 
            className="w-full h-full object-cover" 
            alt="Nightlife Background" 
            fill
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-end px-8 pb-20 max-w-[430px]">
        <motion.div
          key={currentSlide + '-content'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            {SLIDES[currentSlide].icon}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none">
              {SLIDES[currentSlide].title}
            </h1>
            <p className="text-zinc-400 font-medium leading-relaxed italic text-lg">
              {SLIDES[currentSlide].description}
            </p>
          </div>

          <div className="flex gap-2 py-4">
            {SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/20'
                }`} 
              />
            ))}
          </div>

          <button 
            onClick={nextSlide}
            className="w-full bg-white text-black font-black uppercase tracking-tighter italic text-xl py-5 rounded-[2.5rem] shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 group"
          >
            {currentSlide === SLIDES.length - 1 ? "Let's Party" : "Next Vibe"}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </motion.div>
      </div>

      {/* Progress Notch (iOS style) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full z-20">
        <div 
          className="h-full bg-white rounded-full transition-all duration-300" 
          style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
