import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/use-theme.js';
import type { ServerRecord } from '../../types/index.js';

export interface ArchivedDetailViewProps {
  server: ServerRecord;
  cursor: number;
  confirmAction: string | null;
  onRestore: () => void;
  onDelete: () => void;
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const ArchivedDetailView: React.FC<ArchivedDetailViewProps> = ({
  server,
  cursor,
  confirmAction,
  onRestore,
  onDelete,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const actions = [
    { label: t('archived.detail.restore'), action: onRestore },
    { label: t('archived.detail.delete'), action: onDelete },
  ];

  return (
    <Box flexDirection="column" paddingTop={1}>
      {/* Server metadata */}
      <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.border} paddingX={1}>
        <Text bold>{server.name}</Text>
        <Box flexDirection="row" gap={1}>
          <Text dimColor>{t('archived.detail.provider')}:</Text>
          <Text>{server.provider.toUpperCase()}</Text>
        </Box>
        {server.projectId && (
          <Box flexDirection="row" gap={1}>
            <Text dimColor>{t('archived.detail.projectId')}:</Text>
            <Text>{server.projectId}</Text>
          </Box>
        )}
        <Box flexDirection="row" gap={1}>
          <Text dimColor>{t('archived.detail.instanceType')}:</Text>
          <Text>{server.instanceType}</Text>
        </Box>
        {server.zone && (
          <Box flexDirection="row" gap={1}>
            <Text dimColor>{t('archived.detail.zone')}:</Text>
            <Text>{server.zone}</Text>
          </Box>
        )}
        {server.staticIp && (
          <Box flexDirection="row" gap={1}>
            <Text dimColor>{t('archived.detail.staticIp')}:</Text>
            <Text>{server.staticIp}</Text>
          </Box>
        )}
        <Box flexDirection="row" gap={1}>
          <Text dimColor>{t('archived.detail.gameBranch')}:</Text>
          <Text>{server.branch}</Text>
        </Box>
        {server.createdAt && (
          <Box flexDirection="row" gap={1}>
            <Text dimColor>{t('archived.detail.created')}:</Text>
            <Text>{formatDate(server.createdAt)}</Text>
          </Box>
        )}
        {server.archivedAt && (
          <Box flexDirection="row" gap={1}>
            <Text dimColor>{t('archived.detail.archived')}:</Text>
            <Text>{formatDate(server.archivedAt)}</Text>
          </Box>
        )}
      </Box>

      {/* Backup section */}
      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.border} paddingX={1}>
        <Text bold>{t('archived.detail.backupSection')}</Text>
        {server.backupPath ? (
          <>
            <Box flexDirection="row" gap={1}>
              <Text dimColor>{t('archived.detail.backupPath')}:</Text>
              <Text>{server.backupPath}</Text>
            </Box>
            <Box flexDirection="row" gap={1}>
              <Text dimColor>{t('archived.detail.backupSize')}:</Text>
              <Text>{formatBytes(server.backupSize)}</Text>
            </Box>
            <Box flexDirection="row" gap={1}>
              <Text dimColor>{t('archived.detail.backupStatus')}:</Text>
              <Text bold color="green">{t('archived.detail.saved')}</Text>
            </Box>
          </>
        ) : (
          <Text dimColor>{t('archived.detail.noBackupInfo')}</Text>
        )}
      </Box>

      {/* Actions */}
      <Box flexDirection="column" marginTop={1}>
        {actions.map((act, index) => {
          const isSelected = index === cursor;
          return (
            <Text
              key={act.label}
              backgroundColor={isSelected ? theme.colors?.primary : undefined}
              color={isSelected ? 'black' : undefined}
            >
              {isSelected ? '> ' : '  '}{act.label}
            </Text>
          );
        })}
      </Box>

      {/* Inline confirmation banner */}
      {confirmAction === 'delete' && (
        <Box flexDirection="column" marginTop={1} borderStyle="bold" borderColor="red" paddingX={1}>
          <Text bold color="red">{t('archived.confirm.title')}</Text>
          <Text>{t('archived.confirm.message')}</Text>
          <Box flexDirection="row" marginTop={1} gap={2}>
            <Text bold>{t('archived.confirm.cancel')}</Text>
            <Text bold>{t('archived.confirm.confirm')}</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};