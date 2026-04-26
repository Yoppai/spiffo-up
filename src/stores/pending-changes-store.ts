import { create } from 'zustand';
import type { PendingChange } from '../types/index.js';

interface PendingChangesState {
  changes: PendingChange[];
  setChanges: (changes: PendingChange[]) => void;
  addChange: (change: PendingChange) => void;
  clearChanges: () => void;
}

export const usePendingChangesStore = create<PendingChangesState>((set) => ({
  changes: [],
  setChanges: (changes) => set({ changes }),
  addChange: (change) => set((state) => ({ changes: [...state.changes, change] })),
  clearChanges: () => set({ changes: [] }),
}));
