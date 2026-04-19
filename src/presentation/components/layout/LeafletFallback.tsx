'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Club } from '@/domain/types';
import { MapPin, Users, Heart, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LeafletFallbackProps {
  clubs: Club[];
  clubHype: Record<string, number>;
  selectedClub: Club | null;
  setSelectedClub: (club: Club | null) => void;
  userLocation: [number, number] | null;
  favorites: string[];
  toggleFavorite: (clubId: string) => void;
  activeCategory: string;
}

// Internal component to handle map flying/updates
function MapUpdater({ selectedClub, userLocation }: { selectedClub: Club | null, userLocation: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedClub) {
      map.flyTo([selectedClub.lat, selectedClub.lng], 15, { duration: 1.5 });
    }
  }, [selectedClub, map]);

  useEffect(() => {
    // When user location is updated via 'Locate Me', fly to it
    if (userLocation) {
      map.flyTo([userLocation[1], userLocation[0]], 15, { duration: 2 });
    }
  }, [userLocation, map]);

  return null;
}

export default function LeafletFallback({
  clubs,
  clubHype,
  selectedClub,
  setSelectedClub,
  userLocation,
  favorites,
  toggleFavorite,
  activeCategory
}: LeafletFallbackProps) {
  const router = useRouter();
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Initial center (Cologne)
  const center: [number, number] = [50.9375, 6.9583];

  // User location icon (blue pulse dot)
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: '<div class="user-location-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  if (typeof window === 'undefined') return null;

  return (
    <div className="w-full h-full relative" style={{ background: '#000' }}>
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ width: '100%', height: '100%', background: '#000', zIndex: 0 }}
        zoomControl={false}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
          url={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}${window.devicePixelRatio > 1 ? '@2x' : ''}?access_token=${MAPBOX_TOKEN}`}
          tileSize={512}
          zoomOffset={-1}
          detectRetina={true}
        />
        
        <MapUpdater selectedClub={selectedClub} userLocation={userLocation} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation[1], userLocation[0]]} icon={userIcon} />
        )}

        {clubs.map((club) => {
          const clubColor = club.color || '#ec4899';
          
          const clubIcon = L.divIcon({
            className: 'club-marker-icon',
            html: `
              <div class="marker-glow" style="color: ${clubColor}; filter: drop-shadow(0 0 5px ${clubColor});">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3" fill="black"/>
                </svg>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
          });

          return (
            <Marker 
              key={club.id} 
              position={[club.lat, club.lng]} 
              icon={clubIcon}
              eventHandlers={{
                click: () => setSelectedClub(club),
              }}
            >
              <Popup closeButton={false} className="leaflet-custom-popup">
                <div className="bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-[240px] relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClub(null);
                    }}
                    className="absolute top-3 right-3 z-50 bg-black/60 backdrop-blur-md p-2 rounded-full text-white/90 hover:bg-black transition-all shadow-lg active:scale-90"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>

                  <div className="relative h-32 w-full bg-zinc-900">
                    {club.image_url ? (
                      <img
                        src={club.image_url}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                        <MapPin size={32} className="text-white/10" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <h3 className="text-white font-black text-sm uppercase tracking-tight truncate">
                        {club.name}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(club.id);
                      }}
                      className={`absolute top-3 left-3 z-50 p-2 rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-90 ${favorites.includes(club.id)
                          ? 'bg-pink-500 text-white border-pink-400'
                          : 'bg-black/40 text-white/70 hover:text-white'
                        }`}
                    >
                      <Heart size={16} fill={favorites.includes(club.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-zinc-400 text-[10px] leading-relaxed line-clamp-2">
                      {club.description || "Exciting nightlife experience in Cologne."}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                        <MapPin size={10} />
                        <span className="truncate max-w-[100px]">{club.address || 'Cologne'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
                        <Users size={10} className="text-blue-400" />
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{clubHype[club.id] || 0} HYPE</span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/clubs/${club.id}`)}
                      className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                      See More
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
