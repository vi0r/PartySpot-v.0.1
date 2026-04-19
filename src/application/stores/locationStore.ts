import { create } from 'zustand';
import { supabase } from '@/infrastructure/services/supabase';

interface UserLocation {
  id: string;
  username: string;
  avatar_url: string;
  lat: number;
  lng: number;
  last_seen: string;
}

interface LocationStore {
  friendsLocations: Record<string, UserLocation>;
  isGhostMode: boolean;
  setGhostMode: (val: boolean) => Promise<void>;
  updateMyLocation: (lat: number, lng: number) => Promise<void>;
  subscribeToFriends: (userId: string) => () => void;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  friendsLocations: {},
  isGhostMode: false,

  setGhostMode: async (val) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    set({ isGhostMode: val });
    await supabase.from('profiles').update({ is_ghost_mode: val }).eq('id', user.id);
  },

  updateMyLocation: async (lat, lng) => {
    const { isGhostMode } = get();
    if (isGhostMode) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
      lat,
      lng,
      last_seen: new Date().toISOString()
    }).eq('id', user.id);
  },

  subscribeToFriends: (userId) => {
    let friendsList: string[] = [];

    const fetchFriendsAndSubscribe = async () => {
      // 1. Get list of accepted friends
      const { data } = await supabase
        .from('friends')
        .select('user_id1, user_id2')
        .eq('status', 'accepted')
        .or(`user_id1.eq.${userId},user_id2.eq.${userId}`);

      if (data) {
        friendsList = data.map((f: any) => f.user_id1 === userId ? f.user_id2 : f.user_id1);
        
        // 2. Fetch initial locations of friends
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, lat, lng, last_seen, is_ghost_mode')
          .in('id', friendsList);

        if (profiles) {
          const locations: Record<string, UserLocation> = {};
          profiles.forEach(p => {
            if (p.lat && p.lng && !p.is_ghost_mode) {
              locations[p.id] = p;
            }
          });
          set({ friendsLocations: locations });
        }
      }
    };

    fetchFriendsAndSubscribe();

    // 3. Realtime subscription
    const channel = supabase
      .channel('friends-locations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updatedUser = payload.new as any;
          if (friendsList.includes(updatedUser.id)) {
            set((state) => {
              const newLocations = { ...state.friendsLocations };
              if (updatedUser.is_ghost_mode || !updatedUser.lat || !updatedUser.lng) {
                delete newLocations[updatedUser.id];
              } else {
                newLocations[updatedUser.id] = {
                  id: updatedUser.id,
                  username: updatedUser.username,
                  avatar_url: updatedUser.avatar_url,
                  lat: updatedUser.lat,
                  lng: updatedUser.lng,
                  last_seen: updatedUser.last_seen
                };
              }
              return { friendsLocations: newLocations };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));
