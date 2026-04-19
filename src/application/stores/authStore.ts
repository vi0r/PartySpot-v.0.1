import { create } from 'zustand';
import { supabase } from '@/infrastructure/services/supabase';

interface AuthState {
  user: any | null;
  isAdmin: boolean;
  loading: boolean;
  fetchUser: () => Promise<void>;
  updateProfile: (updates: { username?: string; bio?: string; avatar_url?: string; music_genres?: string[] }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAdmin: false,
  loading: true,
  fetchUser: async () => {
    try {
      set({ loading: true });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        // Merge profile data into user object for convenience
        set({ 
          user: { ...user, ...profile }, 
          isAdmin: profile?.is_admin || false 
        });
      } else {
        set({ user: null, isAdmin: false });
      }
    } catch (error) {
      console.error('Error in fetchUser:', error);
      set({ user: null, isAdmin: false });
    } finally {
      set({ loading: false });
    }
  },
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { error: { message: 'Not authenticated' } };

    // Sanitize updates: exclude sensitive fields from the shallow merge
    const sanitizedUpdates = { ...updates };
    const forbidden = ['id', 'is_admin', 'created_at', 'email'];
    forbidden.forEach(key => delete (sanitizedUpdates as any)[key]);

    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
    } else if (data) {
      set({ user: { ...user, ...data } });
    }
    return { error };
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false });
  },
}));
