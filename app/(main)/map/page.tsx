'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Map, Marker, Popup, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl/mapbox';
import { MapPin, Info, X, ExternalLink, Heart, Plus, Loader2, ArrowRight, Pencil, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AddContentModal from '@/components/admin/AddContentModal';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

if (typeof window !== 'undefined') {
  if (!MAPBOX_TOKEN) {
    console.error('CRITICAL: Mapbox Access Token is missing!');
  } else {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }
}

interface Club {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color?: string;
  image_url?: string;
  description?: string;
  address?: string;
  category?: string;
}

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
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubHype, setClubHype] = useState<Record<string, number>>({});
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 2000
        });
      },
      (error) => {
        setErrorMsg(`Location Error: ${error.message}`);
      }
    );
  };

  const CATEGORIES = ['All', 'Techno', 'House', 'Hip Hop', 'Latin', 'Pop', 'Bar', 'Electronic'];

  useEffect(() => {
    fetchClubs();
    fetchFavorites();
    checkAdmin();
  }, []);

  const filteredClubs = activeCategory === 'All'
    ? clubs
    : clubs.filter(c => c.category === activeCategory || (c as any).category === activeCategory);

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

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setIsAdmin(profile.is_admin);
    }
  };

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('favorites')
      .select('club_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavorites(data.map(f => f.club_id));
    }
  };

  const toggleFavorite = async (clubId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
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

  const fetchClubs = async () => {
    try {
      setLoading(true);

      // 1. Fetch Clubs
      const { data: clubsData, error: clubsError } = await supabase.from('clubs').select('*');
      if (clubsError) throw clubsError;
      setClubs(clubsData || []);

      // 2. Fetch Hype (Going counts)
      // Get all events first
      const { data: eventsData, error: eventsError } = await supabase.from('events').select('id, club_id');
      if (!eventsError && eventsData) {
        // Get all going records
        const { data: goingData, error: goingError } = await supabase.from('event_going').select('event_id');
        if (!goingError && goingData) {
          const hypeMap: Record<string, number> = {};

          // Map event_id to club_id
          const eventToClub: Record<string, string> = {};
          eventsData.forEach(ev => eventToClub[ev.id] = ev.club_id);

          // Sum up going records by club
          goingData.forEach(rec => {
            const clubId = eventToClub[rec.event_id];
            if (clubId) {
              hypeMap[clubId] = (hypeMap[clubId] || 0) + 1;
            }
          });
          setClubHype(hypeMap);
        }
      }
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
      <div className="absolute top-6 left-6 right-6 z-20 flex gap-3">
        <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 flex items-center shadow-2xl">
          <input
            type="text"
            placeholder="Search events in Cologne..."
            className="bg-transparent border-none text-white text-sm focus:ring-0 w-full placeholder:text-zinc-500 font-medium"
          />
        </div>
        <button
          onClick={handleLocateMe}
          className="bg-black/60 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-white/10 hover:bg-white hover:text-black transition-all active:scale-95 flex items-center justify-center"
        >
          <MapPin size={20} className="rotate-45" /> {/* Generic crosshair-like look or just MapPin */}
        </button>
        {isAdmin && (
          <button
            onClick={() => {
              setEditData(null);
              setShowAddModal(true);
            }}
            className="bg-white text-black p-4 rounded-2xl shadow-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="absolute top-24 left-6 right-6 z-20 bg-red-500/20 text-red-100 text-[10px] p-2 rounded-lg border border-red-500/50 flex items-center gap-2">
          <Info size={12} />
          {errorMsg}
        </div>
      )}

      <div className="w-full h-full">
        {/* Category Filters */}
        <div className="absolute top-24 left-0 right-0 z-10 px-6 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-2xl ${activeCategory === cat
                  ? 'bg-white text-black border-white'
                  : 'bg-black/60 backdrop-blur-xl text-zinc-400 border-white/5 hover:border-white/20'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          preserveDrawingBuffer={true}
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
          {/* Navigation and Geolocate hidden as we use custom UI */}
          {/* We do NOT render NavigationControl or GeolocateControl here to avoid UI clutter */}

          {filteredClubs.map((club) => (
            <Marker
              key={club.id}
              latitude={club.lat}
              longitude={club.lng}
              anchor="bottom"
            >
              <div className="group relative cursor-pointer">
                <div
                  className="p-1 rounded-full bg-black/60 backdrop-blur-sm border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform hover:scale-110 active:scale-95"
                  style={{ borderColor: club.color || '#ec4899' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClub(club);
                    mapRef.current?.flyTo({
                      center: [club.lng, club.lat],
                      duration: 800,
                      zoom: 14,
                      padding: { bottom: 200 } // Offset for the popup
                    });
                  }}
                >
                  <MapPin size={28} color={club.color || '#ec4899'} fill={club.color || '#ec4899'} className="opacity-90 transition-opacity group-hover:opacity-100" />
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
                {/* Close Button - more prominent */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClub(null);
                  }}
                  className="absolute top-3 right-3 z-50 bg-black/60 backdrop-blur-md p-2 rounded-full text-white/90 hover:bg-black transition-all shadow-lg active:scale-90"
                >
                  <X size={16} strokeWidth={3} />
                </button>

                {/* Edit Button for Admin */}
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

                {/* Card Image */}
                <div className="relative h-32 w-full bg-zinc-900 group/img">
                  {selectedClub.image_url ? (
                    <img
                      src={selectedClub.image_url}
                      alt="" // Empty alt to prevent browser showing broken icon text if URL is invalid
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails, hide it to show the elegant placeholder background
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}

                  {/* Elegant Placeholder for missing/broken images */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                    <MapPin size={32} className="text-white/10" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="text-white font-black text-sm uppercase tracking-tight truncate">
                      {selectedClub.name}
                    </h3>
                  </div>

                  {/* Favorite Toggle Overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(selectedClub.id);
                    }}
                    className={`absolute top-3 left-3 z-50 p-2 rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-90 ${favorites.includes(selectedClub.id)
                        ? 'bg-pink-500 text-white border-pink-400'
                        : 'bg-black/40 text-white/70 hover:text-white'
                      }`}
                  >
                    <Heart size={16} fill={favorites.includes(selectedClub.id) ? "currentColor" : "none"} />
                  </button>
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-3">
                  <p className="text-zinc-400 text-[10px] leading-relaxed line-clamp-3">
                    {selectedClub.description || "Exciting nightlife experience in the heart of Cologne."}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                      <MapPin size={10} />
                      <span className="truncate max-w-[100px]">{selectedClub.address || 'Cologne'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
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

          {clubs.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-zinc-500 text-xs bg-black/40 p-4 rounded-xl">Cologne database is ready.</p>
            </div>
          )}
        </Map>
      </div>

      {/* Admin Add Modal */}
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
