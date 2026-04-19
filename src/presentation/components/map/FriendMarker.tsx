'use client';

import React from 'react';
import { Marker } from 'react-map-gl/mapbox';
import { motion } from 'framer-motion';

interface FriendMarkerProps {
  id: string;
  username: string;
  avatarUrl?: string;
  lat: number;
  lng: number;
  onClick: () => void;
}

export default function FriendMarker({ 
  id, 
  username, 
  avatarUrl, 
  lat, 
  lng, 
  onClick 
}: FriendMarkerProps) {
  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom">
      <div 
        className="group relative cursor-pointer flex flex-col items-center"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {/* Glow / Aura */}
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 animate-pulse" />
        
        {/* Avatar Circle */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative w-12 h-12 rounded-full border-2 border-white bg-zinc-900 overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white font-black text-xs">
              {username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </motion.div>

        {/* Username Label */}
        <div className="mt-2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full shadow-2xl transition-all group-hover:bg-white group-hover:text-black">
          <span className="text-[9px] font-black text-white uppercase tracking-widest group-hover:text-black">
            {username}
          </span>
        </div>

        {/* Pointer Triangle */}
        <div className="w-2 h-2 bg-black border-r border-b border-white/10 rotate-45 -mt-1 opacity-80" />
      </div>
    </Marker>
  );
}
