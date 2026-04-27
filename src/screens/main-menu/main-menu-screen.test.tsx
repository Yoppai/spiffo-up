import { afterEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { DashboardScreen } from './main-menu-screen.js';
import { useAppStore } from '../../stores/app-store.js';

describe('dashboard screen contract', () => {
  afterEach(() => {
    useAppStore.getState().resetNavigation();
  });

  it('exports a component', () => {
    expect(typeof DashboardScreen).toBe('function');
  });

  it('opens the create server wizard from the global menu', () => {
    useAppStore.getState().moveGlobalMenu(-1, 4);
    const app = render(<DashboardScreen />);
    app.stdin.write('\r');
    expect(useAppStore.getState().navigation.current).toBe('wizard');
  });
});
