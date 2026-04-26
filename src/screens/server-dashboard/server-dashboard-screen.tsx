import React from 'react';
import { Box, Text } from 'ink';
import { LayoutShell, SelectableMenu } from '../../components/index.js';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import type { ServerMenuItem, ServerRecord } from '../../types/index.js';
import { countPendingChangesByPanel, formatServerPlayers, formatServerStatus, isActiveServer } from '../../lib/index.js';
import { ApplyPendingChangesModal } from '../../components/pending-changes-modal.js';

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
        right={<ServerContent selectedMenu={selectedMenu} server={selectedServer} pendingChangesCount={pendingChanges} />}
      />
      {modal.isOpen ? <ApplyPendingChangesModal /> : null}
    </>
  );
};

const ServerContent: React.FC<{ selectedMenu: ServerMenuItem; server?: ServerRecord; pendingChangesCount: number }> = ({ selectedMenu, server, pendingChangesCount }) => {
  if (!server) {
    return <Text color="yellow">No hay servidor seleccionado.</Text>;
  }

  if (selectedMenu.id !== 'server-management') {
    return (
      <Box flexDirection="column">
        {pendingChangesCount > 0 ? <PendingChangesBanner count={pendingChangesCount} /> : null}
        <Text color="yellow">Preview</Text>
        <Text>{selectedMenu.label} se implementará en un cambio futuro.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {pendingChangesCount > 0 ? <PendingChangesBanner count={pendingChangesCount} /> : null}
      <Text>Status:   {formatServerStatus(server)}</Text>
      <Text>IP:       {server.publicIp ?? '-'}</Text>
      <Text>Branch:   {server.branch}</Text>
      <Text>Players:  {formatServerPlayers(server)}</Text>
      <Text> </Text>
      {pendingChangesCount > 0 ? <Text color="cyan">Apply All Changes ({pendingChangesCount})</Text> : null}
      <Text color="cyan">&gt;[🚀] Deploy    [⏹] Stop    [🔄] Update    [📦] Archive</Text>
    </Box>
  );
};

const PendingChangesBanner: React.FC<{ count: number }> = ({ count }) => (
  <Box borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1}>
    <Text color="yellow">{count} pending changes · Press Ctrl+A to apply</Text>
  </Box>
);
