import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  isSubscribed: number;
}

interface AuthState {
  user: User | null;
  isSubscribed: boolean;
  syncEnabled: boolean;
  setUser: (user: User | null) => void;
  setSubscribed: (status: boolean) => void;
  setSyncEnabled: (status: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isSubscribed: false,
      syncEnabled: false,
      setUser: (user) => set({ 
        user, 
        isSubscribed: user ? Boolean(user.isSubscribed) : false,
        syncEnabled: user ? Boolean(user.isSubscribed) : false // Auto-enable sync on login if subscribed
      }),
      setSubscribed: (status) => set({ isSubscribed: status, syncEnabled: status }), // Auto-enable sync on sub
      setSyncEnabled: (status) => set({ syncEnabled: status }),
      logout: () => set({ user: null, isSubscribed: false, syncEnabled: false }),
    }),
    {
      name: 'edcm-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
