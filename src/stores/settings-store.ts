import { create } from 'zustand';
import type { AppSettings } from '../types/index.js';

interface SettingsState {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = { locale: 'es', theme: 'dark', backupPath: '' };

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  setSettings: (settings) => set({ settings }),
  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
  resetSettings: () => set({ settings: defaultSettings }),
}));
