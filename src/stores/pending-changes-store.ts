import { create } from 'zustand';
import type { PendingChange } from '../types/index.js';
import { countPendingChangesByPanel, groupPendingChangesByPanel, hasPendingChangesForPanel } from '../lib/pending-changes.js';

interface PendingChangesState {
  changes: PendingChange[];
  secretSessionUnlocked: boolean;
  setChanges: (changes: PendingChange[]) => void;
  addChange: (change: PendingChange) => void;
  addChanges: (changes: PendingChange[]) => void;
  clearChanges: () => void;
  discardAll: () => void;
  getGroupedChanges: () => ReturnType<typeof groupPendingChangesByPanel>;
  getPanelChangeCounts: () => Record<string, number>;
  hasPanelChanges: (panel: string) => boolean;
  hasSensitiveChanges: () => boolean;
  unlockSecretSession: () => void;
  lockSecretSession: () => void;
  reset: () => void;
}

export const usePendingChangesStore = create<PendingChangesState>((set, get) => ({
  changes: [],
  secretSessionUnlocked: false,
  setChanges: (changes) => set({ changes: sanitizePendingChangesForStore(changes) }),
  addChange: (change) => set((state) => ({ changes: [...state.changes, sanitizePendingChangeForStore(change)] })),
  addChanges: (changes) => set((state) => ({ changes: [...state.changes, ...sanitizePendingChangesForStore(changes)] })),
  clearChanges: () => set({ changes: [] }),
  discardAll: () => set({ changes: [], secretSessionUnlocked: false }),
  getGroupedChanges: () => groupPendingChangesByPanel(get().changes),
  getPanelChangeCounts: () => countPendingChangesByPanel(get().changes),
  hasPanelChanges: (panel) => hasPendingChangesForPanel(get().changes, panel),
  hasSensitiveChanges: () => get().changes.some((change) => change.sensitive),
  unlockSecretSession: () => set({ secretSessionUnlocked: true }),
  lockSecretSession: () => set({ secretSessionUnlocked: false }),
  reset: () => set({ changes: [], secretSessionUnlocked: false }),
}));

function sanitizePendingChangesForStore(changes: PendingChange[]): PendingChange[] {
  return changes.map(sanitizePendingChangeForStore);
}

function sanitizePendingChangeForStore(change: PendingChange): PendingChange {
  if (!change.sensitive) {
    return change;
  }

  if (!change.encryptedValue) {
    throw new Error('Sensitive pending changes require encrypted payload before entering the global store');
  }

  return {
    ...change,
    oldValue: '[changed]',
    newValue: '[changed]',
  };
}
