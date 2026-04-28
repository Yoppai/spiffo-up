import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { ArchivedEmptyState } from './archived-empty-state.js';
import type { ServerRecord } from '../../types/index.js';
import { useTheme } from '../../hooks/use-theme.js';

export interface ArchivedListViewProps {
  servers: ServerRecord[];
  cursor: number;
  onSelect?: (index: number) => void;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ArchivedListView: React.FC<ArchivedListViewProps> = ({ servers, cursor }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (servers.length === 0) {
    return <ArchivedEmptyState />;
  }

  const columns = [
    { label: t('archived.list.name'), key: 'name' as const, width: 20 },
    { label: t('archived.list.provider'), key: 'provider' as const, width: 10 },
    { label: t('archived.list.archivedOn'), key: 'archivedAt' as const, width: 15 },
    { label: t('archived.list.backupSize'), key: 'backupSize' as const, width: 12 },
    { label: t('archived.list.status'), key: 'status' as const, width: 10 },
    { label: t('archived.list.actions'), key: 'actions' as const, width: 10 },
  ];

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box flexDirection="row" borderStyle="round" borderColor={theme.colors.border}>
        {columns.map((col) => (
          <Text key={col.key} bold>
            {col.label}
          </Text>
        ))}
      </Box>
      {/* Rows */}
      {servers.map((server, index) => {
        const isSelected = index === cursor;
        const backupStatus = server.backupPath ? t('archived.detail.saved') : t('archived.detail.missing');
        return (
          <Box
            key={server.id}
            flexDirection="row"
            backgroundColor={isSelected ? theme.colors.primary : undefined}
          >
            <Text>{isSelected ? '> ' : '  '}{server.name}</Text>
            <Text>{server.provider.toUpperCase()}</Text>
            <Text>{formatDate(server.archivedAt)}</Text>
            <Text>{formatBytes(server.backupSize)}</Text>
            <Text>{backupStatus}</Text>
            <Text>{index === cursor ? '[ENTER]' : ''}</Text>
          </Box>
        );
      })}
    </Box>
  );
};