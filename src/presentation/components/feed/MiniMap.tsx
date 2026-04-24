'use client';

import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDataStore } from '@/application/stores/dataStore';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

const INITIAL_VIEW_STATE = {
  longitude: 6.9583,
  latitude: 50.9375,
  zoom: 11,
};

export default function MiniMap() {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const { clubs, userLocation, requestLocation, fetchClubs } = useDataStore();
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  useEffect(() => {
    fetchClubs();
    if (!userLocation) {
        requestLocation();
    }
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current) {
        mapRef.current.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 13,
            duration: 2000
        });
    }
  }, [userLocation]);

  return (
    <div className="px-6 mb-8 mt-4">
      <div className="relative h-56 w-full rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-zinc-900 group">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
            </Marker>
          )}

          {clubs.map((club) => (
            <Marker
              key={club.id}
              latitude={club.lat}
              longitude={club.lng}
              anchor="bottom"
            >
              <button
                onClick={() => router.push(`/map?select=${club.id}`)}
                className="text-pink-500 hover:scale-110 active:scale-95 transition-transform"
              >
                <MapPin size={24} className="fill-current drop-shadow-md" />
              </button>
            </Marker>
          ))}
        </Map>

        {/* Overlay gradient for depth */}
        <div className="absolute inset-0 pointer-events-none shadow-[inner_0_0_40px_rgba(0,0,0,0.5)]" />
        
        {/* Navigation Link Overlay */}
        <div 
          onClick={() => router.push('/map')}
          className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white cursor-pointer hover:bg-white hover:text-black transition-all active:scale-95 z-20"
        >
          Full Map
        </div>
      </div>
    </div>
  );
}
