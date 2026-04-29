import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { LayoutShell } from '../../components/index.js';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import { useTheme } from '../../hooks/use-theme.js';
import type { GlobalMenuItem, ServerRecord } from '../../types/index.js';
import { SelectableMenu } from '../../components/index.js';
import { ServerList } from './server-list.js';
import { GlobalSettingsPanel } from '../global-settings/global-settings-panel.js';
import { ArchivedServersPanel } from '../archived-servers/archived-servers-panel.js';
import { isActiveServer } from '../../lib/index.js';

export function useGlobalMenuItems(): GlobalMenuItem[] {
  const { t } = useTranslation();
  return [
    { id: 'create-server', icon: '+', label: t('menu.createServer'), rightPanelTitle: 'Create Server Wizard' },
    { id: 'active-servers', icon: '▶', label: t('menu.activeServers'), rightPanelTitle: 'Active Servers Preview' },
    { id: 'archived-servers', icon: '📦', label: t('menu.archivedServers'), rightPanelTitle: 'Archived Servers' },
    { id: 'global-settings', icon: '⚙', label: t('menu.globalSettings'), rightPanelTitle: 'Global Settings' },
  ];
}

export const globalMenuItems: GlobalMenuItem[] = [
  { id: 'create-server', icon: '+', label: '1. Crear Nuevo Servidor', rightPanelTitle: 'Create Server Wizard' },
  { id: 'active-servers', icon: '▶', label: '2. Servidores Activos', rightPanelTitle: 'Active Servers Preview' },
  { id: 'archived-servers', icon: '📦', label: '3. Servidores Archivados', rightPanelTitle: 'Archived Servers' },
  { id: 'global-settings', icon: '⚙', label: '4. Configuración Global', rightPanelTitle: 'Global Settings' },
];

export const MainMenuView: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useInkStore(useAppStore, (state) => state.navigation);
  const servers = useInkStore(useServersStore, (state) => state.servers);
  const pendingChanges = useInkStore(usePendingChangesStore, (state) => state.changes.length);
  const menuItems = useGlobalMenuItems();
  const selectedMenu = menuItems[navigation.globalMenuIndex] ?? menuItems[0]!;
  const activeServers = servers.filter(isActiveServer);

  return (
    <LayoutShell
      leftTitle="Menu"
      rightTitle={selectedMenu.rightPanelTitle}
      focusedPanel={navigation.focusedPanel}
      activeServers={activeServers.length}
      totalServers={servers.length}
      pendingChangesCount={pendingChanges}
      left={<SelectableMenu items={menuItems} selectedIndex={navigation.globalMenuIndex} />}
      right={<GlobalPreview selectedMenu={selectedMenu} servers={activeServers} cursor={navigation.activeServersCursor} />}
    />
  );
};

const GlobalPreview: React.FC<{ selectedMenu: GlobalMenuItem; servers: ServerRecord[]; cursor: number }> = ({
  selectedMenu,
  servers,
  cursor,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (selectedMenu.id === 'global-settings') {
    return <GlobalSettingsPanel />;
  }

  if (selectedMenu.id === 'archived-servers') {
    return <ArchivedServersPanel />;
  }

  if (selectedMenu.id === 'create-server') {
    return (
      <Box flexDirection="column">
        <Text color={colors.warning}>{t('common.comingSoon')}</Text>
        <Text>{selectedMenu.rightPanelTitle} {t('common.comingSoonDescription')}</Text>
      </Box>
    );
  }

  return <ServerList servers={servers} cursor={cursor} />;
};
