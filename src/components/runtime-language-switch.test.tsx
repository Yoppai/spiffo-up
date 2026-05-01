import { afterEach, beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import i18next from 'i18next';
import '../i18n/config.js';
import { TuiFooter } from './footer.js';
import { ApplyPendingChangesModal } from './pending-changes-modal.js';

beforeAll(async () => {
  await i18next.changeLanguage('en');
});

describe('runtime language switch', () => {
  it('renders footer in English and switches to Spanish', async () => {
    // English: verify Ctrl+A key binding text
    const { lastFrame: frameEn } = render(<TuiFooter pendingChangesCount={2} />);
    expect(frameEn()).toContain('[Ctrl+A] Apply');
    expect(frameEn()).toContain('Navigate');

    // Switch to Spanish
    await i18next.changeLanguage('es');
    const { lastFrame: frameEs } = render(<TuiFooter pendingChangesCount={2} />);
    expect(frameEs()).toContain('Aplicar'); // Spanish for Apply
    expect(frameEs()).toContain('Navegar'); // Spanish for Navigate

    // Switch back to English to avoid polluting other tests
    await i18next.changeLanguage('en');
    const { lastFrame: frameEnBack } = render(<TuiFooter pendingChangesCount={1} />);
    expect(frameEnBack()).toContain('[Ctrl+A] Apply');
    expect(frameEnBack()).toContain('Navigate');
  });

  it('renders ApplyPendingChangesModal in English and Spanish', async () => {
    // Start with Spanish
    await i18next.changeLanguage('es');
    const modalEs = render(<ApplyPendingChangesModal />);
    expect(modalEs.lastFrame() ?? '').toContain('Aplicar Cambios Pendientes'); // Spanish title

    // Switch to English
    await i18next.changeLanguage('en');
    const modalEn = render(<ApplyPendingChangesModal />);
    expect(modalEn.lastFrame() ?? '').toContain('Apply Pending Changes'); // English title

    // Switch back to Spanish
    await i18next.changeLanguage('es');
    const modalEsBack = render(<ApplyPendingChangesModal />);
    expect(modalEsBack.lastFrame() ?? '').toContain('Aplicar Cambios Pendientes');

    // Reset to English for other tests
    await i18next.changeLanguage('en');
  });
});
