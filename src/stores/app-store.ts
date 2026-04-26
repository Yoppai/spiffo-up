import { create } from 'zustand';
import type { NavigationState, NavigationTarget, PanelFocus, PendingChangesModalAction, PendingChangesModalMode, PendingChangesModalState } from '../types/index.js';

const ACTIVE_SERVERS_MENU_INDEX = 1;

const initialNavigation: NavigationState = {
  current: 'dashboard',
  mode: 'global',
  focusedPanel: 'left',
  globalMenuIndex: ACTIVE_SERVERS_MENU_INDEX,
  serverMenuIndex: 0,
  activeServersCursor: 0,
};

const pendingModalActions: PendingChangesModalAction[] = ['apply', 'discard', 'back'];

const initialPendingChangesModal: PendingChangesModalState = {
  isOpen: false,
  selectedAction: 'apply',
  mode: 'summary',
  passphraseInput: '',
  error: null,
  resultMessage: null,
};

interface AppState {
  navigation: NavigationState;
  pendingChangesModal: PendingChangesModalState;
  setNavigationTarget: (target: NavigationTarget) => void;
  setFocusedPanel: (panel: PanelFocus) => void;
  toggleFocusedPanel: () => void;
  moveGlobalMenu: (delta: number, itemCount: number) => void;
  moveServerMenu: (delta: number, itemCount: number) => void;
  moveActiveServersCursor: (delta: number, serverCount: number) => void;
  enterServerDashboard: () => void;
  exitServerDashboard: () => void;
  openPendingChangesModal: () => void;
  closePendingChangesModal: () => void;
  movePendingChangesModalAction: (delta: number) => void;
  setPendingChangesModalAction: (action: PendingChangesModalAction) => void;
  setPendingChangesModalMode: (mode: PendingChangesModalMode) => void;
  setPendingChangesPassphraseInput: (passphraseInput: string) => void;
  setPendingChangesModalError: (error: string | null) => void;
  setPendingChangesModalResult: (resultMessage: string | null) => void;
  resetNavigation: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  navigation: initialNavigation,
  pendingChangesModal: initialPendingChangesModal,
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
      pendingChangesModal: initialPendingChangesModal,
    })),
  openPendingChangesModal: () => set({ pendingChangesModal: { ...initialPendingChangesModal, isOpen: true } }),
  closePendingChangesModal: () => set({ pendingChangesModal: initialPendingChangesModal }),
  movePendingChangesModalAction: (delta) =>
    set((state) => {
      const currentIndex = pendingModalActions.indexOf(state.pendingChangesModal.selectedAction);
      const selectedAction = pendingModalActions[wrapIndex(currentIndex + delta, pendingModalActions.length)] ?? 'apply';
      return { pendingChangesModal: { ...state.pendingChangesModal, selectedAction, error: null } };
    }),
  setPendingChangesModalAction: (selectedAction) => set((state) => ({ pendingChangesModal: { ...state.pendingChangesModal, selectedAction, error: null } })),
  setPendingChangesModalMode: (mode) => set((state) => ({ pendingChangesModal: { ...state.pendingChangesModal, mode, error: null } })),
  setPendingChangesPassphraseInput: (passphraseInput) => set((state) => ({ pendingChangesModal: { ...state.pendingChangesModal, passphraseInput } })),
  setPendingChangesModalError: (error) => set((state) => ({ pendingChangesModal: { ...state.pendingChangesModal, error } })),
  setPendingChangesModalResult: (resultMessage) => set((state) => ({ pendingChangesModal: { ...state.pendingChangesModal, mode: 'result', resultMessage, error: null } })),
  resetNavigation: () => set({ navigation: initialNavigation, pendingChangesModal: initialPendingChangesModal }),
}));

function wrapIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}
