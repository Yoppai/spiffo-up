import { create } from 'zustand';
import type { NavigationState, NavigationTarget, PanelFocus } from '../types/index.js';

const ACTIVE_SERVERS_MENU_INDEX = 1;

const initialNavigation: NavigationState = {
  current: 'dashboard',
  mode: 'global',
  focusedPanel: 'left',
  globalMenuIndex: ACTIVE_SERVERS_MENU_INDEX,
  serverMenuIndex: 0,
  activeServersCursor: 0,
};

interface AppState {
  navigation: NavigationState;
  setNavigationTarget: (target: NavigationTarget) => void;
  setFocusedPanel: (panel: PanelFocus) => void;
  toggleFocusedPanel: () => void;
  moveGlobalMenu: (delta: number, itemCount: number) => void;
  moveServerMenu: (delta: number, itemCount: number) => void;
  moveActiveServersCursor: (delta: number, serverCount: number) => void;
  enterServerDashboard: () => void;
  exitServerDashboard: () => void;
  resetNavigation: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  navigation: initialNavigation,
  setNavigationTarget: (current) => set((state) => ({ navigation: { ...state.navigation, current } })),
  setFocusedPanel: (focusedPanel) => set((state) => ({ navigation: { ...state.navigation, focusedPanel } })),
  toggleFocusedPanel: () =>
    set((state) => ({
      navigation: {
        ...state.navigation,
        focusedPanel: state.navigation.focusedPanel === 'left' ? 'right' : 'left',
      },
    })),
  moveGlobalMenu: (delta, itemCount) =>
    set((state) => ({
      navigation: {
        ...state.navigation,
        globalMenuIndex: wrapIndex(state.navigation.globalMenuIndex + delta, itemCount),
        activeServersCursor: 0,
      },
    })),
  moveServerMenu: (delta, itemCount) =>
    set((state) => ({
      navigation: {
        ...state.navigation,
        serverMenuIndex: wrapIndex(state.navigation.serverMenuIndex + delta, itemCount),
      },
    })),
  moveActiveServersCursor: (delta, serverCount) =>
    set((state) => ({
      navigation: {
        ...state.navigation,
        activeServersCursor: wrapIndex(state.navigation.activeServersCursor + delta, serverCount),
      },
    })),
  enterServerDashboard: () =>
    set((state) => ({
      navigation: {
        ...state.navigation,
        mode: 'server',
        focusedPanel: 'left',
        serverMenuIndex: 0,
        current: 'servers',
      },
    })),
  exitServerDashboard: () =>
    set((state) => ({
      navigation: {
        ...state.navigation,
        mode: 'global',
        focusedPanel: 'left',
        globalMenuIndex: ACTIVE_SERVERS_MENU_INDEX,
        current: 'dashboard',
      },
    })),
  resetNavigation: () => set({ navigation: initialNavigation }),
}));

function wrapIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}
