'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Map, Marker, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl/mapbox';
import { MapPin, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (typeof window !== 'undefined' && MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

interface Club {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color?: string;
}

const INITIAL_VIEW_STATE = {
  longitude: 6.9583,
  latitude: 50.9375,
  zoom: 12,
};

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('clubs').select('*');
      if (error) throw error;
      setClubs(data || []);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error fetching clubs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#121212]">
      {/* Search Header Overlay */}
      <div className="absolute top-6 left-6 right-6 z-20">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 flex items-center shadow-2xl">
          <input
            type="text"
            placeholder="Search events in Cologne..."
            className="bg-transparent border-none text-white text-sm focus:ring-0 w-full placeholder:text-zinc-500 font-medium"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="absolute top-24 left-6 right-6 z-20 bg-red-500/20 text-red-100 text-[10px] p-2 rounded-lg border border-red-500/50 flex items-center gap-2">
          <Info size={12} />
          {errorMsg}
        </div>
      )}

      <div className="w-full h-full">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          onError={(e) => {
            console.error('Mapbox Error:', e.error);
            setErrorMsg(`Map Sync Exception: ${e.error?.message?.substring(0, 30)}...`);
          }}
          onLoad={(e) => {
            setErrorMsg(null);
            setTimeout(() => e.target.resize(), 300);
          }}
          antialias={true}
          reuseMaps={true}
        >
          <NavigationControl position="bottom-right" />
          <GeolocateControl
            position="bottom-right"
            trackUserLocation={true}
            showUserLocation={true}
            showUserHeading={true}
          />

          {clubs.map((club) => (
            <Marker
              key={club.id}
              latitude={club.lat}
              longitude={club.lng}
              anchor="bottom"
            >
              <div className="group relative cursor-pointer">
                <div
                  className="p-1 rounded-full bg-black/60 backdrop-blur-sm border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform hover:scale-110"
                  style={{ borderColor: club.color || '#ec4899' }}
                >
                  <MapPin size={28} color={club.color || '#ec4899'} fill={club.color || '#ec4899'} className="opacity-90" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none uppercase tracking-wider">
                  {club.name}
                </div>
              </div>
            </Marker>
          ))}
          
          {clubs.length === 0 && !loading && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <p className="text-zinc-500 text-xs bg-black/40 p-4 rounded-xl">Cologne database is ready.</p>
             </div>
          )}
        </Map>
      </div>
    </div>
  );
}
