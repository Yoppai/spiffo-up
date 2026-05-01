import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { calculatePendingChangesImpact, groupPendingChangesByPanel } from '../lib/pending-changes.js';
import { useInkStore } from '../hooks/use-ink-store.js';
import { useAppStore } from '../stores/app-store.js';
import { usePendingChangesStore } from '../stores/pending-changes-store.js';
import { useTheme } from '../hooks/use-theme.js';
import type { PendingChangesModalAction } from '../types/index.js';

export const ApplyPendingChangesModal: React.FC = () => {
  const { t } = useTranslation();
  const changes = useInkStore(usePendingChangesStore, (state) => state.changes);
  const modal = useInkStore(useAppStore, (state) => state.pendingChangesModal);
  const { colors } = useTheme();
  const groups = groupPendingChangesByPanel(changes);
  const impact = calculatePendingChangesImpact(changes);

  return (
    <Box justifyContent="center" paddingX={2}>
      <Box borderStyle="double" borderColor={colors.focus} paddingX={1} flexDirection="column" width={76}>
      <Text color={colors.focus}>{t('pendingChanges.title')}</Text>
      {modal.mode === 'result' ? <Text color={colors.success}>{modal.resultMessage ?? t('pendingChanges.result.applied')}</Text> : null}
      {modal.mode === 'passphrase' ? (
        <>
          <Text color={colors.warning}>{t('pendingChanges.passphrase.required')}</Text>
          <Text color={colors.text}>{t('pendingChanges.passphrase.input')} {'*'.repeat(modal.passphraseInput.length)}</Text>
        </>
      ) : null}
      {modal.mode === 'summary' ? (
        <>
          <Text color={colors.text}>{t('pendingChanges.impact.label')} {impact.pipeline.join(' → ') || t('pendingChanges.impact.none')}{impact.requiresVmRecreate ? t('pendingChanges.impact.vmRecreate') : ''}{impact.requiresRestart ? t('pendingChanges.impact.restart') : ''}</Text>
          {groups.map((group) => (
            <Box key={group.panel} flexDirection="column" marginTop={1}>
              <Text color={colors.warning}>{group.panel}</Text>
              {group.changes.map((change) => (
                <Text key={change.id} color={colors.text}>- {change.label}: {change.oldValue ?? '-'} → {change.newValue ?? '-'}</Text>
              ))}
            </Box>
          ))}
        </>
      ) : null}
      {modal.error ? <Text color={colors.error}>{modal.error}</Text> : null}
      <Box marginTop={1}>
        {(['apply', 'discard', 'back'] as PendingChangesModalAction[]).map((action) => (
          <Text key={action} inverse={modal.selectedAction === action} color={modal.selectedAction === action ? colors.focus : colors.text}>
            {' '}{t(`pendingChanges.actions.${action}`)}{' '}
          </Text>
        ))}
      </Box>
      <Text dimColor>{t('pendingChanges.hints.navigate')}</Text>
      </Box>
    </Box>
  );
};
