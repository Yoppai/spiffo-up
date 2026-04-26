import { describe, expect, it } from 'bun:test';
import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { create } from 'zustand';
import { useInkStore } from './use-ink-store.js';

const useCounterStore = create<{ count: number }>(() => ({ count: 1 }));

const CounterView: React.FC = () => {
  const count = useInkStore(useCounterStore, (state) => state.count);
  return <Text>{count}</Text>;
};

describe('useInkStore', () => {
  it('selects store state', () => {
    const { lastFrame } = render(<CounterView />);
    expect(lastFrame()).toContain('1');
  });

  it('re-renders when store state changes', async () => {
    useCounterStore.setState({ count: 1 });

    const { lastFrame } = render(<CounterView />);

    useCounterStore.setState({ count: 2 });
    await Bun.sleep(0);

    expect(lastFrame()).toContain('2');
  });
});
