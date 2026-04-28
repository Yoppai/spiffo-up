import React from 'react';
import { useApp, useInput } from 'ink';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import { MainMenuView, globalMenuItems } from './main-menu-view.js';
import { ServerDashboard, serverMenuItems } from '../server-dashboard/server-dashboard-screen.js';
import { handleDashboardPanelInput } from '../server-dashboard/dashboard-panels.js';
import { handleGlobalSettingsInput } from './global-settings-input.js';
import { handleArchivedServersInput } from '../archived-servers/archived-servers-input.js';
import { CreateServerWizard, handleCreateServerWizardInput } from '../create-server-wizard/create-server-wizard-screen.js';
import { PendingChangeDecryptError, isActiveServer } from '../../lib/index.js';
import type { NavigationState, ServerRecord } from '../../types/index.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { PendingChangesApplicationService, getLocalInventoryService } from '../../services/index.js';
import { ApplyPendingChangesModal } from '../../components/pending-changes-modal.js';

const GLOBAL_MENU_ACTIVE_SERVERS_INDEX = 1;
const GLOBAL_MENU_CREATE_SERVER_INDEX = 0;
const GLOBAL_MENU_ARCHIVED_SERVERS_INDEX = 2;
const GLOBAL_MENU_GLOBAL_SETTINGS_INDEX = 3;
const BACK_TO_SERVERS_INDEX = serverMenuItems.length - 1;

export const DashboardScreen: React.FC = () => {
  const { exit } = useApp();
  const navigation = useInkStore(useAppStore, (state) => state.navigation);
  const servers = useInkStore(useServersStore, (state) => state.servers);
  const activeServers = servers.filter(isActiveServer);

  useInput((input, key) => {
    const app = useAppStore.getState();
    const serverStore = useServersStore.getState();
    const pendingStore = usePendingChangesStore.getState();

    if (app.pendingChangesModal.isOpen) {
      return handlePendingChangesModalInput({ app, input, key, pendingStore });
    }

    if ((input === '\u0001' || (key.ctrl && input.toLowerCase() === 'a')) && pendingStore.changes.length > 0) {
      app.openPendingChangesModal();
      return;
    }

    if (navigation.current === 'wizard') {
      return handleCreateServerWizardInput({ app, input, key });
    }

    if (input.toLowerCase() === 'q') return exit();
    if (key.tab) return app.toggleFocusedPanel();

    if (navigation.mode === 'server') {
      return handleServerInput({ app, input, key, navigation, pendingChangesCount: pendingStore.changes.length, pendingStore });
    }

    return handleGlobalInput({ app, key, navigation, activeServers, serverStore, input });
  });

  if (navigation.mode === 'server') {
    return <DashboardFrame><ServerDashboard /></DashboardFrame>;
  }

  if (navigation.current === 'wizard') {
    return <DashboardFrame><CreateServerWizard /></DashboardFrame>;
  }

  return <DashboardFrame><MainMenuView /></DashboardFrame>;
};

const DashboardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modal = useInkStore(useAppStore, (state) => state.pendingChangesModal);
  return <>{children}{modal.isOpen ? <ApplyPendingChangesModal /> : null}</>;
};

function handleGlobalInput({
  app,
  key,
  navigation,
  activeServers,
  serverStore,
  input,
}: {
  app: ReturnType<typeof useAppStore.getState>;
  key: { upArrow?: boolean; downArrow?: boolean; return?: boolean; escape?: boolean; backspace?: boolean; delete?: boolean };
  navigation: NavigationState;
  activeServers: ReadonlyArray<ServerRecord>;
  serverStore: ReturnType<typeof useServersStore.getState>;
  input: string;
}) {
  if (navigation.focusedPanel === 'left') {
    if (key.upArrow) app.moveGlobalMenu(-1, globalMenuItems.length);
    if (key.downArrow) app.moveGlobalMenu(1, globalMenuItems.length);
    if (key.return && navigation.globalMenuIndex === GLOBAL_MENU_CREATE_SERVER_INDEX) app.openCreateServerWizard();
    return;
  }

  if (navigation.globalMenuIndex === GLOBAL_MENU_GLOBAL_SETTINGS_INDEX) {
    return handleGlobalSettingsInput({ app, key, navigation, input });
  }

  if (navigation.globalMenuIndex === GLOBAL_MENU_ARCHIVED_SERVERS_INDEX) {
    return handleArchivedServersInput({ app, key, navigation, serverStore });
  }

  if (key.upArrow) app.moveActiveServersCursor(-1, activeServers.length);
  if (key.downArrow) app.moveActiveServersCursor(1, activeServers.length);

  if (key.return && navigation.globalMenuIndex === GLOBAL_MENU_ACTIVE_SERVERS_INDEX) {
    const selectedServer = activeServers[navigation.activeServersCursor];

    if (!selectedServer) {
      return;
    }

    serverStore.selectServer(selectedServer.id);
    app.enterServerDashboard();
  }
}

function handleServerInput({
  app,
  input,
  key,
  navigation,
  pendingChangesCount,
  pendingStore,
}: {
  app: ReturnType<typeof useAppStore.getState>;
  input: string;
  key: { upArrow?: boolean; downArrow?: boolean; leftArrow?: boolean; rightArrow?: boolean; escape?: boolean; return?: boolean; ctrl?: boolean; backspace?: boolean; delete?: boolean };
  navigation: NavigationState;
  pendingChangesCount: number;
  pendingStore: ReturnType<typeof usePendingChangesStore.getState>;
}) {
  if ((input === '\u0001' || (key.ctrl && input.toLowerCase() === 'a')) && pendingChangesCount > 0) {
    app.openPendingChangesModal();
    return;
  }

  if (key.escape) {
    if (pendingChangesCount > 0) {
      app.openPendingChangesModal();
    } else {
      app.exitServerDashboard();
    }
    return;
  }

  if (navigation.focusedPanel !== 'left') {
    const serverStore = useServersStore.getState();
    const server = serverStore.servers.find((candidate) => candidate.id === serverStore.selectedServerId);
    const selectedPanel = serverMenuItems[navigation.serverMenuIndex]?.id;
    if (server && selectedPanel) {
      handleDashboardPanelInput({ app, pendingStore, input, key, server, panel: selectedPanel });
    }
    return;
  }

  if (key.upArrow) app.moveServerMenu(-1, serverMenuItems.length);
  if (key.downArrow) app.moveServerMenu(1, serverMenuItems.length);
  if (key.return && navigation.serverMenuIndex === BACK_TO_SERVERS_INDEX) {
    if (pendingChangesCount > 0) {
      app.openPendingChangesModal();
    } else {
      app.exitServerDashboard();
    }
  }
}

function handlePendingChangesModalInput({
  app,
  input,
  key,
  pendingStore,
}: {
  app: ReturnType<typeof useAppStore.getState>;
  input: string;
  key: { leftArrow?: boolean; rightArrow?: boolean; escape?: boolean; return?: boolean; backspace?: boolean; delete?: boolean };
  pendingStore: ReturnType<typeof usePendingChangesStore.getState>;
}) {
  if (key.escape) {
    app.closePendingChangesModal();
    return;
  }

  if (app.pendingChangesModal.mode === 'passphrase') {
    if (key.backspace || key.delete) {
      app.setPendingChangesPassphraseInput(app.pendingChangesModal.passphraseInput.slice(0, -1));
      return;
    }

    if (!key.return && input.length === 1 && input >= ' ') {
      app.setPendingChangesPassphraseInput(`${app.pendingChangesModal.passphraseInput}${input}`);
      return;
    }
  }

  if (key.leftArrow) app.movePendingChangesModalAction(-1);
  if (key.rightArrow) app.movePendingChangesModalAction(1);
  if (key.return) void confirmPendingChangesModalAction(app, pendingStore);
}

async function confirmPendingChangesModalAction(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>): Promise<void> {
  const action = app.pendingChangesModal.selectedAction;

  if (action === 'back') {
    app.closePendingChangesModal();
    return;
  }

  if (action === 'discard') {
    const inventory = getLocalInventoryService();
    if (!inventory) {
      app.setPendingChangesModalError('Inventory service unavailable.');
      return;
    }

    const service = new PendingChangesApplicationService(inventory, pendingStore);
    service.discardAll();
    app.closePendingChangesModal();
    return;
  }

  if (pendingStore.hasSensitiveChanges() && (!pendingStore.secretSessionUnlocked || !app.pendingChangesModal.passphraseInput) && app.pendingChangesModal.mode !== 'passphrase') {
    app.setPendingChangesModalMode('passphrase');
    return;
  }

  const inventory = getLocalInventoryService();
  if (!inventory) {
    app.setPendingChangesModalError('Inventory service unavailable.');
    return;
  }

  const service = new PendingChangesApplicationService(inventory, pendingStore);

  try {
    const result = await service.applyAllAsync({ changes: pendingStore.changes, passphrase: app.pendingChangesModal.passphraseInput });
    app.setPendingChangesModalResult(`Applied ${result.impact.total} changes in ${result.steps.length} steps.`);
  } catch (error) {
    app.setPendingChangesModalError(error instanceof PendingChangeDecryptError ? 'Invalid passphrase. Back to edit or discard buffer.' : 'Could not apply pending changes.');
  }
}
