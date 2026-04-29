import { create } from 'zustand';
import type { AppSettings } from '../types/index.js';
import { getLocalInventoryService } from '../services/index.js';

interface SettingsState {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = { locale: 'es', theme: 'default-dark', backupPath: '' };

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  setSettings: (settings) => set({ settings }),
  updateSettings: (settings) => {
    set((state) => {
      const merged = { ...state.settings, ...settings };
      const inventory = getLocalInventoryService();
      if (inventory) {
        inventory.updateSettings(merged);
      }
      return { settings: merged };
    });
  },
  resetSettings: () => {
    const inventory = getLocalInventoryService();
    if (inventory) {
      inventory.updateSettings(defaultSettings);
    }
    set({ settings: defaultSettings });
  },
}));
