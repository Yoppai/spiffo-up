import React from 'react';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import { ArchivedListView } from './archived-list-view.js';
import { ArchivedDetailView } from './archived-detail-view.js';

export const ArchivedServersPanel: React.FC = () => {
  const navigation = useInkStore(useAppStore, (state) => state.navigation);
  const servers = useInkStore(useServersStore, (state) => state.servers);
  const archivedServers = servers.filter((s) => s.status === 'archived');

  const isDetailMode = navigation.globalRightMode === 'archived-detail';
  const isListMode = navigation.globalRightMode === 'archived-list' || navigation.globalRightMode === 'list';

  if (isDetailMode && archivedServers.length > 0) {
    const listIndex = Math.min(navigation.globalRightCursor, archivedServers.length - 1);
    const selectedServer = archivedServers[listIndex];
    if (!selectedServer) {
      return <ArchivedListView servers={archivedServers} cursor={0} />;
    }
    return (
      <ArchivedDetailView
        server={selectedServer}
        cursor={0}
        confirmAction={navigation.globalRightConfirmAction}
        onRestore={() => {}}
        onDelete={() => {}}
      />
    );
  }

  if (isListMode) {
    return (
      <ArchivedListView
        servers={archivedServers}
        cursor={Math.min(navigation.globalRightCursor, Math.max(0, archivedServers.length - 1))}
      />
    );
  }

  return (
    <ArchivedListView
      servers={archivedServers}
      cursor={navigation.globalRightCursor}
    />
  );
};