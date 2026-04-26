import React from 'react';
import { Box, Text } from 'ink';
import { LayoutShell, SelectableMenu } from '../../components/index.js';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import type { ServerMenuItem, ServerRecord } from '../../types/index.js';
import { formatServerPlayers, formatServerStatus, isActiveServer } from '../../lib/index.js';

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
  const pendingChanges = useInkStore(usePendingChangesStore, (state) => state.changes.length);
  const selectedServer = servers.find((server) => server.id === selectedServerId);
  const activeServers = servers.filter(isActiveServer);
  const selectedMenu = serverMenuItems[navigation.serverMenuIndex] ?? serverMenuItems[0]!;

  return (
    <LayoutShell
      leftTitle={selectedServer?.name ?? 'Server'}
      rightTitle={selectedMenu.label}
      focusedPanel={navigation.focusedPanel}
      activeServers={activeServers.length}
      totalServers={servers.length}
      pendingChangesCount={pendingChanges}
      left={<SelectableMenu items={serverMenuItems} selectedIndex={navigation.serverMenuIndex} />}
      right={<ServerContent selectedMenu={selectedMenu} server={selectedServer} />}
    />
  );
};

const ServerContent: React.FC<{ selectedMenu: ServerMenuItem; server?: ServerRecord }> = ({ selectedMenu, server }) => {
  if (!server) {
    return <Text color="yellow">No hay servidor seleccionado.</Text>;
  }

  if (selectedMenu.id !== 'server-management') {
    return (
      <Box flexDirection="column">
        <Text color="yellow">Preview</Text>
        <Text>{selectedMenu.label} se implementará en un cambio futuro.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>Status:   {formatServerStatus(server)}</Text>
      <Text>IP:       {server.publicIp ?? '-'}</Text>
      <Text>Branch:   {server.branch}</Text>
      <Text>Players:  {formatServerPlayers(server)}</Text>
      <Text> </Text>
      <Text color="cyan">&gt;[🚀] Deploy    [⏹] Stop    [🔄] Update    [📦] Archive</Text>
    </Box>
  );
};
