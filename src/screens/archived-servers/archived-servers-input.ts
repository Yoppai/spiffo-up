import type { NavigationState } from '../../types/index.js';
import type { useAppStore } from '../../stores/app-store.js';

const ACTIONS_COUNT = 2; // Restore, Delete

interface ArchivedServersInputParams {
  app: ReturnType<typeof useAppStore.getState>;
  key: { upArrow?: boolean; downArrow?: boolean; return?: boolean; escape?: boolean };
  navigation: NavigationState;
  serverStore: ReturnType<typeof import('../../stores/servers-store.js').useServersStore.getState>;
}

export function handleArchivedServersInput({ app, key, navigation, serverStore }: ArchivedServersInputParams): void {
  const archivedServers = serverStore.servers.filter((s) => s.status === 'archived');

  // List mode
  if (navigation.globalRightMode === 'archived-list' || navigation.globalRightMode === 'list') {
    if (key.upArrow) {
      app.moveGlobalRightCursor(-1, archivedServers.length);
      return;
    }
    if (key.downArrow) {
      app.moveGlobalRightCursor(1, archivedServers.length);
      return;
    }
    if (key.return && archivedServers.length > 0) {
      app.setGlobalRightMode('archived-detail');
      return;
    }
    if (key.escape) {
      app.setFocusedPanel('left');
      return;
    }
    return;
  }

  // Detail mode
  if (navigation.globalRightMode === 'archived-detail') {
    // If confirm action is active
    if (navigation.globalRightConfirmAction === 'delete') {
      if (key.escape) {
        app.setGlobalRightConfirmAction(null);
        return;
      }
      if (key.return) {
        // Execute delete stub - just clear confirm and go back to list
        app.setGlobalRightConfirmAction(null);
        app.setGlobalRightMode('archived-list');
        return;
      }
      return;
    }

    // Normal detail navigation
    if (key.escape) {
      app.setGlobalRightMode('archived-list');
      return;
    }
    if (key.upArrow) {
      app.moveGlobalRightCursor(-1, ACTIONS_COUNT);
      return;
    }
    if (key.downArrow) {
      app.moveGlobalRightCursor(1, ACTIONS_COUNT);
      return;
    }
    if (key.return) {
      const actionIndex = navigation.globalRightCursor;
      if (actionIndex === 0) {
        // Restore - stub, just go back to list
        app.setGlobalRightMode('archived-list');
        return;
      }
      if (actionIndex === 1) {
        // Delete - activate confirmation
        app.setGlobalRightConfirmAction('delete');
        return;
      }
      return;
    }
    return;
  }
}