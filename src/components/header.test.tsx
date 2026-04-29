import { describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { TuiHeader } from './header.js';

describe('TuiHeader', () => {
  it('renders product title using ink-big-text (non-empty output)', () => {
    const { lastFrame } = render(<TuiHeader />);
    const frame = lastFrame() ?? '';
    // ink-big-text renders ASCII art, so we verify non-empty output
    expect(frame.length).toBeGreaterThan(50);
  });

  it('does NOT render duplicate product titles (only one ink-big-text instance)', () => {
    const { lastFrame } = render(<TuiHeader />);
    const frame = lastFrame() ?? '';
    // ink-big-text renders ASCII art blocks (█) - count significant render elements
    // Should have substantial ASCII art output (more than single line), not empty
    expect(frame.length).toBeGreaterThan(50);
    // Should NOT have two distinct ASCII art renders - verify single title block
    // Split by double newlines to count distinct blocks
    const blocks = frame.split(/\n\n+/).filter((b) => b.trim().length > 0);
    expect(blocks.length).toBe(1);
  });

  it('uses ink-big-text component for product title', () => {
    const { lastFrame } = render(<TuiHeader />);
    const frame = lastFrame() ?? '';
    // ink-big-text renders ASCII art characters (█, ╗, ║, etc.)
    // Verify it produces substantial ASCII art output
    expect(frame).toMatch(/[█╗║╔╚╝═╬╠╣╦╩]/);
  });
});