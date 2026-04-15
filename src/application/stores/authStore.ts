import { create } from 'zustand';
import { supabase } from '@/infrastructure/services/supabase';

interface AuthState {
  user: any | null;
  isAdmin: boolean;
  loading: boolean;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
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
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();
        
        set({ user, isAdmin: profile?.is_admin || false });
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
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false });
  },
}));
