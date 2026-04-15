import { create } from 'zustand';
import { supabase } from '@/infrastructure/services/supabase';

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

interface Event {
  id: string;
  title: string;
  description: string;
  media_url?: string;
  club_id: string;
  clubs?: Club;
}

interface DataState {
  clubs: Club[];
  events: Event[];
  clubHype: Record<string, number>;
  userLikes: string[];
  loading: boolean;
  fetchClubs: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchHype: () => Promise<void>;
  fetchUserLikes: (userId: string) => Promise<void>;
  toggleLike: (userId: string, eventId: string) => Promise<void>;
  
  // Geolocation features
  userLocation: { lat: number; lng: number } | null;
  requestLocation: () => void;
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  formatDistance: (dist: number) => string;
}

export const useDataStore = create<DataState>((set, get) => ({
  clubs: [],
  events: [],
  clubHype: {},
  loading: false,
  userLikes: [],
  userLocation: null,

  requestLocation: () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => set({ userLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
        (err) => console.error('Error getting location', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  },

  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  formatDistance: (dist) => {
    if (dist < 1) return `${Math.round(dist * 1000)}m`;
    return `${dist.toFixed(1)}km`;
  },

  fetchClubs: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('clubs').select('*');
    if (!error) set({ clubs: data || [] });
    set({ loading: false });
  },

  fetchEvents: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('events')
      .select('*, clubs(*)')
      .order('created_at', { ascending: false });
    if (!error) set({ events: data || [] });
    set({ loading: false });
  },

  fetchHype: async () => {
    const { data: eventsData } = await supabase.from('events').select('id, club_id');
    const { data: goingData } = await supabase.from('event_going').select('event_id');
    
    if (eventsData && goingData) {
      const hypeMap: Record<string, number> = {};
      const eventToClub: Record<string, string> = {};
      eventsData.forEach(ev => eventToClub[ev.id] = ev.club_id);
      
      goingData.forEach(rec => {
        const clubId = eventToClub[rec.event_id];
        if (clubId) {
          hypeMap[clubId] = (hypeMap[clubId] || 0) + 1;
        }
      });
      set({ clubHype: hypeMap });
    }
  },

  fetchUserLikes: async (userId: string) => {
    const { data, error } = await supabase
      .from('event_likes')
      .select('event_id')
      .eq('user_id', userId);

    if (!error && data) {
      set({ userLikes: data.map(l => l.event_id) });
    }
  },

  toggleLike: async (userId: string, eventId: string) => {
    const isLiked = get().userLikes.includes(eventId);
    
    if (isLiked) {
      await supabase.from('event_likes').delete().eq('user_id', userId).eq('event_id', eventId);
      set({ userLikes: get().userLikes.filter(id => id !== eventId) });
    } else {
      await supabase.from('event_likes').insert({ user_id: userId, event_id: eventId });
      set({ userLikes: [...get().userLikes, eventId] });
    }
  }
}));
