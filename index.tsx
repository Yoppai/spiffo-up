#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { App } from './src/cli/app.js';

const { waitUntilExit } = render(<App />);

await waitUntilExit();
