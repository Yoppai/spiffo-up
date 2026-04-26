#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { App } from './src/cli/app.js';
import { bootstrapLocalInventory } from './src/services/index.js';

bootstrapLocalInventory();

const { waitUntilExit } = render(<App />);

await waitUntilExit();
