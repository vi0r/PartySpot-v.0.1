import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type NavStyle = 'bottom' | 'side';
type DockSide = 'left' | 'right';

interface UIState {
  navStyle: NavStyle;
  dockSide: DockSide;
  isDockOpen: boolean;
  
  // Feed Search State
  feedSearchQuery: string;
  feedActiveCategory: string;
  isFeedFilterOpen: boolean;
  
  setNavStyle: (style: NavStyle) => void;
  setDockSide: (side: DockSide) => void;
  toggleDock: (forceClosed?: boolean) => void;
  
  // Feed Actions
  setFeedSearchQuery: (query: string) => void;
  setFeedActiveCategory: (category: string) => void;
  setFeedFilterOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      navStyle: 'bottom',
      dockSide: 'right',
      isDockOpen: false,
      
      feedSearchQuery: '',
      feedActiveCategory: 'All',
      isFeedFilterOpen: false,
      
      setNavStyle: (navStyle) => set({ navStyle, isDockOpen: false }),
      setDockSide: (dockSide) => set({ dockSide }),
      toggleDock: (forceClosed) => set((state) => ({ 
        isDockOpen: forceClosed !== undefined ? !forceClosed : !state.isDockOpen 
      })),
      
      setFeedSearchQuery: (feedSearchQuery) => set({ feedSearchQuery }),
      setFeedActiveCategory: (feedActiveCategory) => set({ feedActiveCategory }),
      setFeedFilterOpen: (isFeedFilterOpen) => set({ isFeedFilterOpen }),
    }),
    {
      name: 'partyspot-ui-storage',
    }
  )
);
