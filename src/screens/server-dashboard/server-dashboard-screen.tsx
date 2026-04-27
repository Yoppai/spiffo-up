import React from 'react';
import { Text } from 'ink';
import { LayoutShell, SelectableMenu } from '../../components/index.js';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import type { DashboardPanelUiState, ServerMenuItem, ServerRecord } from '../../types/index.js';
import { countPendingChangesByPanel, isActiveServer } from '../../lib/index.js';
import { ApplyPendingChangesModal } from '../../components/pending-changes-modal.js';
import { DashboardPanel, getPanelUi } from './dashboard-panels.js';

export const serverMenuItems: ServerMenuItem[] = [
  { id: 'server-management', icon: '🖥', label: 'Server Management' },
  { id: 'provider-region', icon: '☁', label: 'Provider & Region' },
  { id: 'build', icon: '🔧', label: 'Build' },
  { id: 'players', icon: '👥', label: 'Players' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'basic-settings', icon: '⚙', label: 'Basic Settings' },
  { id: 'advanced-settings', icon: '🔒', label: 'Advanced' },
  { id: 'admins', icon: '👤', label: 'Admins' },
  { id: 'scheduler', icon: '⏰', label: 'Scheduler' },
  { id: 'backups', icon: '💾', label: 'Backups' },
  { id: 'back-to-servers', icon: '←', label: 'Back to Servers' },
];

export const ServerDashboard: React.FC = () => {
  const navigation = useInkStore(useAppStore, (state) => state.navigation);
  const servers = useInkStore(useServersStore, (state) => state.servers);
  const selectedServerId = useInkStore(useServersStore, (state) => state.selectedServerId);
  const changes = useInkStore(usePendingChangesStore, (state) => state.changes);
  const pendingChanges = changes.length;
  const selectedServer = servers.find((server) => server.id === selectedServerId);
  const activeServers = servers.filter(isActiveServer);
  const selectedMenu = serverMenuItems[navigation.serverMenuIndex] ?? serverMenuItems[0]!;
  const panelCounts = countPendingChangesByPanel(changes);
  const modal = useInkStore(useAppStore, (state) => state.pendingChangesModal);
  const dashboardPanels = useInkStore(useAppStore, (state) => state.dashboardPanels);
  const items = serverMenuItems.map((item) => ({ ...item, label: panelCounts[item.id] ? `${item.label} •` : item.label }));

  return (
    <>
      <LayoutShell
        leftTitle={selectedServer?.name ?? 'Server'}
        rightTitle={selectedMenu.label}
        focusedPanel={navigation.focusedPanel}
        activeServers={activeServers.length}
        totalServers={servers.length}
        pendingChangesCount={pendingChanges}
        left={<SelectableMenu items={items} selectedIndex={navigation.serverMenuIndex} />}
        right={<ServerContent selectedMenu={selectedMenu} server={selectedServer} pendingChangesCount={pendingChanges} ui={getPanelUi(dashboardPanels, selectedMenu.id)} />}
      />
      {modal.isOpen ? <ApplyPendingChangesModal /> : null}
    </>
  );
};

const ServerContent: React.FC<{ selectedMenu: ServerMenuItem; server?: ServerRecord; pendingChangesCount: number; ui: DashboardPanelUiState }> = ({ selectedMenu, server, pendingChangesCount, ui }) => {
  if (!server) {
    return <Text color="yellow">No hay servidor seleccionado.</Text>;
  }

  return <DashboardPanel selectedMenu={selectedMenu} server={server} pendingChangesCount={pendingChangesCount} ui={ui} />;
};
