import { useSyncExternalStore } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

export function useInkStore<TState, TSelected>(
  store: UseBoundStore<StoreApi<TState>>,
  selector: (state: TState) => TSelected,
): TSelected {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(store.getState()));
}
