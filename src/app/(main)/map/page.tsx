'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Map, Marker, Popup, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl/mapbox';
import { MapPin, Info, X, ExternalLink, Heart, Plus, Loader2, ArrowRight, Pencil, Users } from 'lucide-react';
import { supabase } from '@/infrastructure/services/supabase';
import AddContentModal from '@/presentation/components/admin/AddContentModal';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import dynamic from 'next/dynamic';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

if (typeof window !== 'undefined') {
  if (!MAPBOX_TOKEN) {
    console.error('CRITICAL: Mapbox Access Token is missing!');
  } else {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }
}

import { Club } from '@/domain/types';
import { useAuthStore } from '@/application/stores/authStore';
import { useDataStore } from '@/application/stores/dataStore';

// Dynamically import Leaflet with SSR disabled as it relies on 'window'
const LeafletFallback = dynamic(
  () => import('@/presentation/components/layout/LeafletFallback'),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-white" />
      </div>
    )
  }
);

const INITIAL_VIEW_STATE = {
  longitude: 6.9583,
  latitude: 50.9375,
  zoom: 12,
};

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-white" />
      </div>
    }>
      <MapContent />
    </Suspense>
  );
}

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);

  // Store Hooks
  const { user, isAdmin, fetchUser } = useAuthStore();
  const { clubs, clubHype, fetchClubs, fetchHype, loading } = useDataStore();

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

  // Prevent map initialization race condition & Check WebGL
  useEffect(() => {
    const t = setTimeout(() => {
      setMapReady(true);
      if (typeof window !== 'undefined' && mapboxgl) {
        const supported = mapboxgl.supported();
        console.log("Mapbox WebGL Supported:", supported);
        setWebGLSupported(supported);
      }
    }, 150);
    return () => clearTimeout(t);
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation([longitude, latitude]);
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 2000
        });
        setIsLocating(false);
      },
      (error) => {
        setErrorMsg(`Location Error: ${error.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const CATEGORIES = ['ALL', 'TECHNO', 'HOUSE', 'HIP HOP', 'LATIN', 'POP', 'BAR', 'ELECTRONIC', 'RAVE'];

  useEffect(() => {
    fetchClubs();
    fetchHype();
    fetchUser();
    fetchFavorites();
  }, []);

  const filteredClubs = clubs.filter(club => {
    const clubCat = (club.category || '').toUpperCase().trim();
    const activeCat = activeCategory.toUpperCase().trim();
    
    const matchesCategory = activeCat === 'ALL' || clubCat === activeCat;
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const searchResults = searchQuery.length > 0 
    ? clubs.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Handle URL selection
  useEffect(() => {
    const selectId = searchParams.get('select');
    if (selectId && clubs.length > 0) {
      const club = clubs.find(c => c.id === selectId);
      if (club) {
        setSelectedClub(club);
        mapRef.current?.flyTo({
          center: [club.lng, club.lat],
          duration: 1000,
          zoom: 15,
          padding: { bottom: 200 }
        });
      }
    }
  }, [searchParams, clubs]);

  const fetchFavorites = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('favorites')
      .select('club_id')
      .eq('user_id', currentUser.id);

    if (!error && data) {
      setFavorites(data.map(f => f.club_id));
    }
  };

  const toggleFavorite = async (clubId: string) => {
    if (!user) {
      alert('Please log in to save favorites!');
      return;
    }

    const isFav = favorites.includes(clubId);

    if (isFav) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('club_id', clubId);

      if (!error) setFavorites(prev => prev.filter(id => id !== clubId));
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, club_id: clubId });

      if (!error) setFavorites(prev => [...prev, clubId]);
    }
  };

  return (
    <div className="absolute inset-x-0 top-0 bottom-[80px] bg-background overflow-hidden" id="map-container">
      {/* Search Header Overlay */}
      <div className="absolute top-14 left-6 right-6 z-20 flex flex-col gap-2">
        <div className="flex gap-3">
          <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl px-5 py-4 flex items-center shadow-2xl">
            <input
              type="text"
              placeholder="Search events in Cologne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-white text-sm focus:ring-0 w-full placeholder:text-zinc-500 font-medium"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditData(null);
                setShowAddModal(true);
              }}
              className="bg-white text-black p-4 rounded-3xl shadow-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center shrink-0 w-14 h-14"
            >
              <Plus size={20} />
            </button>
          )}
          <button
            onClick={handleLocateMe}
            className={`bg-black/60 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/10 transition-all active:scale-95 flex items-center justify-center shrink-0 w-14 h-14 ${isLocating ? 'text-blue-400 animate-pulse' : 'text-white hover:bg-white hover:text-black'}`}
          >
            <MapPin size={20} className="rotate-45" />
          </button>
        </div>

        {/* Search Results Dropdown List */}
        {searchResults.length > 0 && (
          <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-[100] max-h-[280px] overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-200 mt-2">
            {searchResults.map((club) => (
              <button
                key={club.id}
                onClick={() => {
                  setSelectedClub(club);
                  setSearchQuery('');
                  if (webGLSupported) {
                    mapRef.current?.flyTo({
                      center: [club.lng, club.lat],
                      zoom: 15,
                      duration: 1200,
                      padding: { top: 120, bottom: 0 }
                    });
                  }
                }}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-none group"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-white text-sm font-bold">{club.name}</span>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">{club.category}</span>
                </div>
                <ArrowRight size={14} className="text-zinc-600 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="absolute top-32 left-6 right-6 z-20 bg-red-500/20 text-red-100 text-[10px] p-3 rounded-2xl border border-red-500/50 flex items-center gap-2">
          <Info size={14} />
          {errorMsg}
        </div>
      )}

      <div className="w-full h-full relative">
        {/* Category Filters */}
        <div className="absolute top-32 left-0 right-0 z-10 px-6 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-2xl active:scale-95 ${activeCategory === cat
                  ? 'bg-white text-black border-white'
                  : 'bg-black/60 backdrop-blur-xl text-zinc-400 border-white/5 hover:border-white/20'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {mapReady && (
          webGLSupported ? (
            <Map
              ref={mapRef}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}
              preserveDrawingBuffer={true}
              antialias={true}
              failIfMajorPerformanceCaveat={false}
              localIdeographFontFamily="'Helvetica Neue', 'Helvetica', sans-serif"
              onError={(e) => {
                console.error('Mapbox Error:', e.error);
                setErrorMsg(`Map Sync Exception: ${e.error?.message?.substring(0, 30)}...`);
              }}
              onLoad={(e) => {
                setErrorMsg(null);
                console.log('Map successfully loaded');
                window.dispatchEvent(new Event('resize'));
                setTimeout(() => e.target.resize(), 100);
                setTimeout(() => e.target.resize(), 500);
              }}
              reuseMaps={true}
            >
              {/* User Location Marker */}
              {userLocation && (
                <Marker longitude={userLocation[0]} latitude={userLocation[1]}>
                  <div className="user-location-dot" />
                </Marker>
              )}

              {filteredClubs.map((club) => (
                <Marker
                  key={club.id}
                  latitude={club.lat}
                  longitude={club.lng}
                  anchor="bottom"
                >
                  <div className="group relative cursor-pointer">
                    <div
                      className={`marker-glow transition-all duration-300 hover:scale-110 active:scale-95 text-opacity-80 ${(clubHype[club.id] || 0) > 5 ? 'hype-pulse' : ''}`}
                      style={{ color: club.color || '#ec4899' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClub(club);
                        mapRef.current?.flyTo({
                          center: [club.lng, club.lat],
                          duration: 800,
                          zoom: 15,
                          padding: { top: 120, bottom: 0 }
                        });
                      }}
                    >
                      <MapPin size={28} className="fill-current drop-shadow-lg" />
                    </div>
                    {(!selectedClub || selectedClub.id !== club.id) && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none uppercase tracking-wider transition-all duration-200">
                        {club.name}
                      </div>
                    )}
                  </div>
                </Marker>
              ))}

              {selectedClub && (
                <Popup
                  latitude={selectedClub.lat}
                  longitude={selectedClub.lng}
                  anchor="bottom"
                  onClose={() => setSelectedClub(null)}
                  closeButton={false}
                  maxWidth="300px"
                  className="club-popup z-30"
                  offset={15}
                >
                  <div className="bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 w-[240px] relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClub(null);
                      }}
                      className="absolute top-3 right-3 z-50 bg-black/60 backdrop-blur-md p-2 rounded-full text-white/90 hover:bg-black transition-all shadow-lg active:scale-90"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditData(selectedClub);
                          setShowAddModal(true);
                        }}
                        className="absolute top-14 right-3 z-50 bg-black/60 backdrop-blur-md p-2 rounded-full text-white/90 hover:bg-white hover:text-black transition-all shadow-lg active:scale-90"
                      >
                        <Pencil size={16} />
                      </button>
                    )}

                    <div className="relative h-32 w-full bg-zinc-900 group/img">
                      {selectedClub.image_url ? (
                        <img
                          src={selectedClub.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                        <MapPin size={32} className="text-white/10" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <h3 className="text-white font-black text-sm uppercase tracking-tight truncate">
                          {selectedClub.name}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(selectedClub.id);
                        }}
                        className={`absolute top-3 left-3 z-50 p-2 rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-90 ${favorites.includes(selectedClub.id) ? 'bg-pink-500 text-white' : 'bg-black/40 text-white/70'}`}
                      >
                        <Heart size={16} fill={favorites.includes(selectedClub.id) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      <p className="text-zinc-400 text-[10px] leading-relaxed line-clamp-3">
                        {selectedClub.description || "Exciting nightlife experience in the heart of Cologne."}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                          <MapPin size={10} />
                          <span className="truncate max-w-[100px]">{selectedClub.address || 'Cologne'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg animate-pulse">
                          <Users size={10} className="text-blue-400" />
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{clubHype[selectedClub.id] || 0} HYPE</span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/clubs/${selectedClub.id}`)}
                        className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all group"
                      >
                        See More
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          ) : (
            <LeafletFallback 
              clubs={filteredClubs}
              clubHype={clubHype}
              selectedClub={selectedClub}
              setSelectedClub={setSelectedClub}
              userLocation={userLocation}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              activeCategory={activeCategory}
            />
          )
        )}
      </div>

      <AddContentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        type="club"
        onSuccess={fetchClubs}
        editData={editData}
      />
    </div>
  );
}
