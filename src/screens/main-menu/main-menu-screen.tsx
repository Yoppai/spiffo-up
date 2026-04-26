import React from 'react';
import { useApp, useInput } from 'ink';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import { MainMenuView, globalMenuItems } from './main-menu-view.js';
import { ServerDashboard, serverMenuItems } from '../server-dashboard/server-dashboard-screen.js';
import { isActiveServer } from '../../lib/index.js';
import type { NavigationState, ServerRecord } from '../../types/index.js';

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

    if (input.toLowerCase() === 'q') return exit();
    if (key.tab) return app.toggleFocusedPanel();

    if (navigation.mode === 'server') {
      return handleServerInput({ app, key, navigation });
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
  key,
  navigation,
}: {
  app: ReturnType<typeof useAppStore.getState>;
  key: { upArrow?: boolean; downArrow?: boolean; escape?: boolean; return?: boolean };
  navigation: NavigationState;
}) {
  if (key.escape) {
    app.exitServerDashboard();
    return;
  }

  if (navigation.focusedPanel !== 'left') {
    return;
  }

  if (key.upArrow) app.moveServerMenu(-1, serverMenuItems.length);
  if (key.downArrow) app.moveServerMenu(1, serverMenuItems.length);
  if (key.return && navigation.serverMenuIndex === BACK_TO_SERVERS_INDEX) app.exitServerDashboard();
}
