import { create } from 'zustand';
import type { DashboardPanelUiState, NavigationState, NavigationTarget, PanelFocus, PendingChangesModalAction, PendingChangesModalMode, PendingChangesModalState, ServerMenuId } from '../types/index.js';

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

const initialDashboardPanelUi: DashboardPanelUiState = {
  rightCursor: 0,
  rightActionCursor: 0,
  subView: 'main',
  drafts: {},
  validationErrors: {},
  statusMessage: null,
  confirmAction: null,
};

interface AppState {
  navigation: NavigationState;
  pendingChangesModal: PendingChangesModalState;
  dashboardPanels: Partial<Record<ServerMenuId, DashboardPanelUiState>>;
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
  getDashboardPanelUi: (panel: ServerMenuId) => DashboardPanelUiState;
  patchDashboardPanelUi: (panel: ServerMenuId, patch: Partial<DashboardPanelUiState>) => void;
  moveDashboardRightCursor: (panel: ServerMenuId, delta: number, itemCount: number) => void;
  moveDashboardActionCursor: (panel: ServerMenuId, delta: number, itemCount: number) => void;
  setDashboardDraft: (panel: ServerMenuId, field: string, value: string) => void;
  resetDashboardPanelUi: (panel?: ServerMenuId) => void;
  resetNavigation: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  navigation: initialNavigation,
  pendingChangesModal: initialPendingChangesModal,
  dashboardPanels: {},
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
  getDashboardPanelUi: (panel) => useAppStore.getState().dashboardPanels[panel] ?? initialDashboardPanelUi,
  patchDashboardPanelUi: (panel, patch) =>
    set((state) => ({
      dashboardPanels: {
        ...state.dashboardPanels,
        [panel]: { ...(state.dashboardPanels[panel] ?? initialDashboardPanelUi), ...patch },
      },
    })),
  moveDashboardRightCursor: (panel, delta, itemCount) =>
    set((state) => {
      const current = state.dashboardPanels[panel] ?? initialDashboardPanelUi;
      return {
        dashboardPanels: {
          ...state.dashboardPanels,
          [panel]: { ...current, rightCursor: wrapIndex(current.rightCursor + delta, itemCount), validationErrors: {} },
        },
      };
    }),
  moveDashboardActionCursor: (panel, delta, itemCount) =>
    set((state) => {
      const current = state.dashboardPanels[panel] ?? initialDashboardPanelUi;
      return {
        dashboardPanels: {
          ...state.dashboardPanels,
          [panel]: { ...current, rightActionCursor: wrapIndex(current.rightActionCursor + delta, itemCount), validationErrors: {} },
        },
      };
    }),
  setDashboardDraft: (panel, field, value) =>
    set((state) => {
      const current = state.dashboardPanels[panel] ?? initialDashboardPanelUi;
      return {
        dashboardPanels: {
          ...state.dashboardPanels,
          [panel]: { ...current, drafts: { ...current.drafts, [field]: value }, validationErrors: { ...current.validationErrors, [field]: '' } },
        },
      };
    }),
  resetDashboardPanelUi: (panel) =>
    set((state) => {
      if (!panel) {
        return { dashboardPanels: {} };
      }

      const next = { ...state.dashboardPanels };
      delete next[panel];
      return { dashboardPanels: next };
    }),
  resetNavigation: () => set({ navigation: initialNavigation, pendingChangesModal: initialPendingChangesModal, dashboardPanels: {} }),
}));

function wrapIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}
