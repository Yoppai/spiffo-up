import { create } from 'zustand';
import type { AppSettings } from '../types/index.js';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { locale: 'es', theme: 'dark' },
  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
}));
