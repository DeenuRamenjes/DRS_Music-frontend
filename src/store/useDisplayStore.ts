import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DisplayState {
  theme: 'dark' | 'light';
  accentColor: 'emerald' | 'blue' | 'purple' | 'pink' | 'orange';
  compactMode: boolean;
  layout: 'default' | 'compact' | 'expanded';
  sidebarCollapsed: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setAccentColor: (color: 'emerald' | 'blue' | 'purple' | 'pink' | 'orange') => void;
  setCompactMode: (enabled: boolean) => void;
  setLayout: (layout: 'default' | 'compact' | 'expanded') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const useDisplayStore = create<DisplayState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: 'emerald',
      compactMode: false,
      layout: 'default',
      sidebarCollapsed: false,

      setTheme: (theme: 'dark' | 'light') =>
        set(() => ({
          theme,
        })),

      setAccentColor: (color: 'emerald' | 'blue' | 'purple' | 'pink' | 'orange') =>
        set(() => ({
          accentColor: color,
        })),

      setCompactMode: (enabled: boolean) =>
        set(() => ({
          compactMode: enabled,
        })),

      setLayout: (layout: 'default' | 'compact' | 'expanded') =>
        set(() => ({
          layout,
        })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set(() => ({
          sidebarCollapsed: collapsed,
        })),
    }),
    {
      name: 'display:settings',
    }
  )
);

export default useDisplayStore;
