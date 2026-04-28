import { beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import '../../i18n/config.js';
import i18next from 'i18next';
import { ArchivedEmptyState } from './archived-empty-state.js';

beforeAll(async () => {
  await i18next.changeLanguage('en');
});

describe('ArchivedEmptyState', () => {
  it('renders empty state message with i18n', () => {
    const { lastFrame } = render(<ArchivedEmptyState />);
    expect(lastFrame()).toContain('No archived servers found');
  });

  it('message includes explanation about archiving', () => {
    const { lastFrame } = render(<ArchivedEmptyState />);
    expect(lastFrame()).toContain('Servers that have been archived will appear here');
  });
});