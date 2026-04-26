import React from 'react';
import { useApp, useInput } from 'ink';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import { MainMenuView, globalMenuItems } from './main-menu-view.js';
import { ServerDashboard, serverMenuItems } from '../server-dashboard/server-dashboard-screen.js';
import { PendingChangeDecryptError, isActiveServer } from '../../lib/index.js';
import type { NavigationState, ServerRecord } from '../../types/index.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { PendingChangesApplicationService, getLocalInventoryService } from '../../services/index.js';

const GLOBAL_MENU_ACTIVE_SERVERS_INDEX = 1;
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

    if (input.toLowerCase() === 'q') return exit();
    if (key.tab) return app.toggleFocusedPanel();

    if (navigation.mode === 'server') {
      return handleServerInput({ app, input, key, navigation, pendingChangesCount: pendingStore.changes.length });
    }

    return handleGlobalInput({ app, key, navigation, activeServers, serverStore });
  });

  if (navigation.mode === 'server') {
    return <ServerDashboard />;
  }

  return <MainMenuView />;
};

function handleGlobalInput({
  app,
  key,
  navigation,
  activeServers,
  serverStore,
}: {
  app: ReturnType<typeof useAppStore.getState>;
  key: { upArrow?: boolean; downArrow?: boolean; return?: boolean };
  navigation: NavigationState;
  activeServers: ReadonlyArray<ServerRecord>;
  serverStore: ReturnType<typeof useServersStore.getState>;
}) {
  if (navigation.focusedPanel === 'left') {
    if (key.upArrow) app.moveGlobalMenu(-1, globalMenuItems.length);
    if (key.downArrow) app.moveGlobalMenu(1, globalMenuItems.length);
    return;
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
}: {
  app: ReturnType<typeof useAppStore.getState>;
  input: string;
  key: { upArrow?: boolean; downArrow?: boolean; escape?: boolean; return?: boolean; ctrl?: boolean };
  navigation: NavigationState;
  pendingChangesCount: number;
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
  if (key.return) confirmPendingChangesModalAction(app, pendingStore);
}

function confirmPendingChangesModalAction(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>): void {
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
    const result = service.applyAll({ changes: pendingStore.changes, passphrase: app.pendingChangesModal.passphraseInput });
    app.setPendingChangesModalResult(`Applied ${result.impact.total} changes locally in ${result.steps.length} steps.`);
  } catch (error) {
    app.setPendingChangesModalError(error instanceof PendingChangeDecryptError ? 'Invalid passphrase. Back to edit or discard buffer.' : 'Could not apply pending changes.');
  }
}
