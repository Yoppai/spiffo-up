import { create } from 'zustand';
import { gcpRegions, instanceTiers, providerOptions, wizardSteps } from '../screens/create-server-wizard/catalog.js';
import { validateWizardServerName } from '../services/create-server-wizard-service.js';
import type { CreateServerWizardState, DashboardPanelUiState, NavigationState, NavigationTarget, PanelFocus, PendingChangesModalAction, PendingChangesModalMode, PendingChangesModalState, ServerMenuId } from '../types/index.js';

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

const initialCreateServerWizard: CreateServerWizardState = {
  stepIndex: 0,
  providerCursor: 0,
  actionCursor: 1,
  regionCursor: 0,
  zoneCursor: 0,
  instanceCursor: 1,
  draft: {
    provider: 'gcp',
    projectId: '',
    serverName: '',
    region: gcpRegions[0]?.id ?? 'us-central1',
    zone: gcpRegions[0]?.zones[0]?.id ?? 'us-central1-a',
    instanceType: instanceTiers[1]?.instanceType ?? instanceTiers[0]?.instanceType ?? 'e2-standard-2',
  },
  validationErrors: {},
  statusMessage: null,
};

interface AppState {
  navigation: NavigationState;
  pendingChangesModal: PendingChangesModalState;
  dashboardPanels: Partial<Record<ServerMenuId, DashboardPanelUiState>>;
  createServerWizard: CreateServerWizardState;
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
  openCreateServerWizard: () => void;
  cancelCreateServerWizard: () => void;
  resetCreateServerWizard: () => void;
  moveWizardProviderCursor: (delta: number) => void;
  moveWizardActionCursor: (delta: number, actionCount: number) => void;
  moveWizardRegionCursor: (delta: number) => void;
  moveWizardZoneCursor: (delta: number) => void;
  moveWizardInstanceCursor: (delta: number) => void;
  setWizardProjectId: (projectId: string) => void;
  setWizardServerName: (serverName: string) => void;
  nextWizardStep: () => boolean;
  previousWizardStep: () => void;
  setWizardStatusMessage: (statusMessage: string | null) => void;
  resetNavigation: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  navigation: initialNavigation,
  pendingChangesModal: initialPendingChangesModal,
  dashboardPanels: {},
  createServerWizard: initialCreateServerWizard,
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
  openCreateServerWizard: () =>
    set((state) => ({
      navigation: { ...state.navigation, current: 'wizard', mode: 'global', focusedPanel: 'left' },
      createServerWizard: initialCreateServerWizard,
    })),
  cancelCreateServerWizard: () =>
    set((state) => ({
      navigation: { ...state.navigation, current: 'dashboard', mode: 'global', focusedPanel: 'left' },
      createServerWizard: initialCreateServerWizard,
    })),
  resetCreateServerWizard: () => set({ createServerWizard: initialCreateServerWizard }),
  moveWizardProviderCursor: (delta) =>
    set((state) => {
      const providerCursor = wrapIndex(state.createServerWizard.providerCursor + delta, providerOptions.length);
      const provider = providerOptions[providerCursor]?.enabled ? providerOptions[providerCursor].id : state.createServerWizard.draft.provider;
      return { createServerWizard: { ...state.createServerWizard, providerCursor, draft: { ...state.createServerWizard.draft, provider }, validationErrors: {}, statusMessage: null } };
    }),
  moveWizardActionCursor: (delta, actionCount) =>
    set((state) => ({ createServerWizard: { ...state.createServerWizard, actionCursor: wrapIndex(state.createServerWizard.actionCursor + delta, actionCount), validationErrors: {}, statusMessage: null } })),
  moveWizardRegionCursor: (delta) =>
    set((state) => {
      const regionCursor = wrapIndex(state.createServerWizard.regionCursor + delta, gcpRegions.length);
      const region = gcpRegions[regionCursor] ?? gcpRegions[0]!;
      return { createServerWizard: { ...state.createServerWizard, regionCursor, zoneCursor: 0, draft: { ...state.createServerWizard.draft, region: region.id, zone: region.zones[0]?.id ?? '' } } };
    }),
  moveWizardZoneCursor: (delta) =>
    set((state) => {
      const region = gcpRegions[state.createServerWizard.regionCursor] ?? gcpRegions[0]!;
      const zoneCursor = wrapIndex(state.createServerWizard.zoneCursor + delta, region.zones.length);
      return { createServerWizard: { ...state.createServerWizard, zoneCursor, draft: { ...state.createServerWizard.draft, zone: region.zones[zoneCursor]?.id ?? '' } } };
    }),
  moveWizardInstanceCursor: (delta) =>
    set((state) => {
      const instanceCursor = wrapIndex(state.createServerWizard.instanceCursor + delta, instanceTiers.length);
      return { createServerWizard: { ...state.createServerWizard, instanceCursor, draft: { ...state.createServerWizard.draft, instanceType: instanceTiers[instanceCursor]?.instanceType ?? state.createServerWizard.draft.instanceType } } };
    }),
  setWizardProjectId: (projectId) => set((state) => ({ createServerWizard: { ...state.createServerWizard, draft: { ...state.createServerWizard.draft, projectId } } })),
  setWizardServerName: (serverName) => set((state) => ({ createServerWizard: { ...state.createServerWizard, draft: { ...state.createServerWizard.draft, serverName }, validationErrors: { ...state.createServerWizard.validationErrors, serverName: '' } } })),
  nextWizardStep: () => {
    const current = useAppStore.getState().createServerWizard;
    if (wizardSteps[current.stepIndex]?.id === 'server-name') {
      const error = validateWizardServerName(current.draft.serverName);
      if (error) {
        set({ createServerWizard: { ...current, validationErrors: { ...current.validationErrors, serverName: error } } });
        return false;
      }
    }

    if (current.stepIndex >= wizardSteps.length - 1) return true;
    set({ createServerWizard: { ...current, stepIndex: current.stepIndex + 1, actionCursor: 1, validationErrors: {}, statusMessage: null } });
    return true;
  },
  previousWizardStep: () =>
    set((state) => {
      if (state.createServerWizard.stepIndex <= 0) {
        return { createServerWizard: { ...state.createServerWizard, actionCursor: 0, statusMessage: 'Cancel Wizard focused. Press Enter to cancel.' } };
      }

      return { createServerWizard: { ...state.createServerWizard, stepIndex: state.createServerWizard.stepIndex - 1, actionCursor: 1, validationErrors: {}, statusMessage: null } };
    }),
  setWizardStatusMessage: (statusMessage) => set((state) => ({ createServerWizard: { ...state.createServerWizard, statusMessage } })),
  resetNavigation: () => set({ navigation: initialNavigation, pendingChangesModal: initialPendingChangesModal, dashboardPanels: {}, createServerWizard: initialCreateServerWizard }),
}));

function wrapIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}
