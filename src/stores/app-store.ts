import { create } from 'zustand';
import type { NavigationState, NavigationTarget } from '../types/index.js';

interface AppState {
  navigation: NavigationState;
  setNavigationTarget: (target: NavigationTarget) => void;
}

export const useAppStore = create<AppState>((set) => ({
  navigation: { current: 'dashboard' },
  setNavigationTarget: (current) => set({ navigation: { current } }),
}));
