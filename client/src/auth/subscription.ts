import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  isSubscribed: boolean;
  syncEnabled: boolean;
  setSubscribed: (status: boolean) => void;
  setSyncEnabled: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isSubscribed: false,
      syncEnabled: false,
      setSubscribed: (status) => set({ isSubscribed: status, syncEnabled: status }), // Auto-enable sync on sub
      setSyncEnabled: (status) => set({ syncEnabled: status }),
    }),
    {
      name: 'edcm-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
