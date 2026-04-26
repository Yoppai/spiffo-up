import { describe, expect, it } from 'bun:test';
import { DashboardScreen } from './main-menu-screen.js';

describe('dashboard screen contract', () => {
  it('exports a component', () => {
    expect(typeof DashboardScreen).toBe('function');
  });
});
