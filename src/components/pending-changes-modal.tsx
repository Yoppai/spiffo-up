import React from 'react';
import { Box, Text } from 'ink';
import { calculatePendingChangesImpact, groupPendingChangesByPanel } from '../lib/pending-changes.js';
import { useInkStore } from '../hooks/use-ink-store.js';
import { useAppStore } from '../stores/app-store.js';
import { usePendingChangesStore } from '../stores/pending-changes-store.js';
import { useTheme } from '../hooks/use-theme.js';
import type { PendingChangesModalAction } from '../types/index.js';

const actionLabels: Record<PendingChangesModalAction, string> = {
  apply: 'Apply All',
  discard: 'Discard All',
  back: 'Back to Edit',
};

export const ApplyPendingChangesModal: React.FC = () => {
  const changes = useInkStore(usePendingChangesStore, (state) => state.changes);
  const modal = useInkStore(useAppStore, (state) => state.pendingChangesModal);
  const { colors } = useTheme();
  const groups = groupPendingChangesByPanel(changes);
  const impact = calculatePendingChangesImpact(changes);

  return (
    <Box justifyContent="center" paddingX={2}>
      <Box borderStyle="double" borderColor={colors.focus} paddingX={1} flexDirection="column" width={76}>
      <Text color={colors.focus}>Apply Pending Changes</Text>
      {modal.mode === 'result' ? <Text color={colors.success}>{modal.resultMessage ?? 'Applied pending changes locally.'}</Text> : null}
      {modal.mode === 'passphrase' ? (
        <>
          <Text color={colors.warning}>Sensitive changes require session passphrase.</Text>
          <Text color={colors.text}>Passphrase: {'*'.repeat(modal.passphraseInput.length)}</Text>
        </>
      ) : null}
      {modal.mode === 'summary' ? (
        <>
          <Text color={colors.text}>Impact: {impact.pipeline.join(' → ') || 'none'}{impact.requiresVmRecreate ? ' · VM recreate' : ''}{impact.requiresRestart ? ' · restart' : ''}</Text>
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
            {' '}{actionLabels[action]}{' '}
          </Text>
        ))}
      </Box>
      <Text dimColor>←/→ Select · ENTER Confirm · ESC Back to Edit</Text>
      </Box>
    </Box>
  );
};
