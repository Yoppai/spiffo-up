import { create } from 'zustand';
import type { PendingChange } from '../types/index.js';

interface PendingChangesState {
  changes: PendingChange[];
  addChange: (change: PendingChange) => void;
  clearChanges: () => void;
}

export const usePendingChangesStore = create<PendingChangesState>((set) => ({
  changes: [],
  addChange: (change) => set((state) => ({ changes: [...state.changes, change] })),
  clearChanges: () => set({ changes: [] }),
}));
