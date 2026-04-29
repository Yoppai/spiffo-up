#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { App } from './src/cli/app.js';
import { bootstrapLocalInventory } from './src/services/index.js';
import { initializeI18n } from './src/i18n/config.js';
import { loadExternalThemes } from './src/themes/theme-loader.js';

const { service } = bootstrapLocalInventory();
const settings = service.getSettings();
initializeI18n(settings.locale);
loadExternalThemes();

const { waitUntilExit } = render(<App />);

await waitUntilExit();
