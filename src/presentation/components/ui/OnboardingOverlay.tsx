'use client';

import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Map, CalendarHeart, Share2 } from 'lucide-react';

export default function OnboardingOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the onboarding
    const hasSeen = localStorage.getItem('partySpot_onboarded');
    if (hasSeen !== 'true') {
      setShow(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('partySpot_onboarded', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center">
      <Swiper
        modules={[Pagination]}
        pagination={{ clickable: true }}
        className="w-full h-[100dvh]"
      >
        <SwiperSlide className="flex flex-col items-center justify-center px-8 text-center bg-zinc-950">
          <div className="bg-pink-500/10 p-8 rounded-full mb-8">
            <Map size={60} className="text-pink-500" />
          </div>
          <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-4">
            Discover Nightlife
          </h1>
          <p className="text-zinc-400 font-medium leading-relaxed mb-12">
            Find the best underground raves, techno clubs, and exclusive events curated for Cologne.
          </p>
        </SwiperSlide>

        <SwiperSlide className="flex flex-col items-center justify-center px-8 text-center bg-zinc-950">
          <div className="bg-blue-500/10 p-8 rounded-full mb-8">
            <CalendarHeart size={60} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-4">
            Plan Your Weekends
          </h1>
          <p className="text-zinc-400 font-medium leading-relaxed mb-12">
            Add events to your personal calendar. We'll send you a reminder 2 hours before the party starts!
          </p>
        </SwiperSlide>

        <SwiperSlide className="flex flex-col items-center justify-center px-8 text-center bg-zinc-950">
          <div className="bg-white/10 p-8 rounded-full mb-8">
            <Share2 size={60} className="text-white" />
          </div>
          <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-4">
            Share The Vibe
          </h1>
          <p className="text-zinc-400 font-medium leading-relaxed mb-12">
            Easily send event links directly to your friends on WhatsApp or Telegram and figure out the plans together.
          </p>
          <div className="absolute bottom-16 left-8 right-8">
            <button 
              onClick={completeOnboarding}
              className="w-full bg-white text-black font-black uppercase tracking-tighter italic text-xl py-5 rounded-3xl shadow-2xl active:scale-95 transition-transform"
            >
              Let's Party
            </button>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
