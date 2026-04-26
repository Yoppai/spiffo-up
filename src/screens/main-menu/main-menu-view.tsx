import React from 'react';
import { Box, Text } from 'ink';
import { LayoutShell } from '../../components/index.js';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import type { GlobalMenuItem, ServerRecord } from '../../types/index.js';
import { SelectableMenu } from '../../components/index.js';
import { ServerList } from './server-list.js';
import { isActiveServer } from '../../lib/index.js';

export const globalMenuItems: GlobalMenuItem[] = [
  { id: 'create-server', icon: '+', label: '1. Crear Nuevo Servidor', rightPanelTitle: 'Create Server Wizard' },
  { id: 'active-servers', icon: '▶', label: '2. Servidores Activos', rightPanelTitle: 'Active Servers Preview' },
  { id: 'archived-servers', icon: '📦', label: '3. Servidores Archivados', rightPanelTitle: 'Archived Servers' },
  { id: 'global-settings', icon: '⚙', label: '4. Configuración Global', rightPanelTitle: 'Global Settings' },
];

export const MainMenuView: React.FC = () => {
  const navigation = useInkStore(useAppStore, (state) => state.navigation);
  const servers = useInkStore(useServersStore, (state) => state.servers);
  const pendingChanges = useInkStore(usePendingChangesStore, (state) => state.changes.length);
  const selectedMenu = globalMenuItems[navigation.globalMenuIndex] ?? globalMenuItems[0]!;
  const activeServers = servers.filter(isActiveServer);

  return (
    <LayoutShell
      leftTitle="Menu"
      rightTitle={selectedMenu.rightPanelTitle}
      focusedPanel={navigation.focusedPanel}
      activeServers={activeServers.length}
      totalServers={servers.length}
      pendingChangesCount={pendingChanges}
      left={<SelectableMenu items={globalMenuItems} selectedIndex={navigation.globalMenuIndex} />}
      right={<GlobalPreview selectedMenu={selectedMenu} servers={activeServers} cursor={navigation.activeServersCursor} />}
    />
  );
};

const GlobalPreview: React.FC<{ selectedMenu: GlobalMenuItem; servers: ServerRecord[]; cursor: number }> = ({
  selectedMenu,
  servers,
  cursor,
}) => {
  if (selectedMenu.id !== 'active-servers') {
    return (
      <Box flexDirection="column">
        <Text color="yellow">Coming Soon</Text>
        <Text>{selectedMenu.rightPanelTitle} estará disponible en un cambio futuro.</Text>
      </Box>
    );
  }

  return <ServerList servers={servers} cursor={cursor} />;
};
