import { create } from 'zustand';
import type { AppStore } from '../types';

export const useAppStore = create<AppStore>((set) => ({
  isLoading: false,
  error: null,

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
  
  clearError: () => set({ error: null }),
}));
