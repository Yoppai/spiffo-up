import { describe, expect, it } from 'bun:test';
import { App } from './app.js';

describe('App contract', () => {
  it('exports a component', () => {
    expect(typeof App).toBe('function');
  });
});
