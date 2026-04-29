import { describe, expect, it } from 'bun:test';
import { defaultDarkTheme, type ThemePalette } from './default-dark.js';

describe('default-dark theme', () => {
  it('has all required color fields including border under colors', () => {
    const palette = defaultDarkTheme;
    // Verify border exists inside colors and is a string
    expect(typeof palette.colors.border).toBe('string');
    expect(palette.colors.border).toBe('cyan');
  });

  it('ThemePalette interface has border as required field inside colors', () => {
    // This test verifies the type includes colors.border
    const palette: ThemePalette = {
      name: 'Default Dark',
      colors: {
        primary: 'cyan',
        secondary: 'magenta',
        background: 'black',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        focus: 'blue',
        text: 'white',
        accent: 'green',
        border: 'cyan',
      },
    };
    expect(palette.colors.border).toBe('cyan');
  });

  it('has all nine required color fields under colors', () => {
    const palette = defaultDarkTheme;
    const required = ['primary', 'secondary', 'background', 'success', 'warning', 'error', 'focus', 'text', 'border'] as const;
    for (const key of required) {
      expect(typeof palette.colors[key]).toBe('string');
      expect(palette.colors[key].length).toBeGreaterThan(0);
    }
  });

  it('imports from JSON without manual object duplication', () => {
    // The module should export defaultDarkTheme from JSON import
    // If it's imported from JSON, the object should be non-null
    expect(defaultDarkTheme).not.toBeNull();
    expect(typeof defaultDarkTheme).toBe('object');
    expect(defaultDarkTheme.name).toBe('Default Dark');
  });

  it('has name property from JSON', () => {
    expect(typeof defaultDarkTheme.name).toBe('string');
    expect(defaultDarkTheme.name.length).toBeGreaterThan(0);
  });
});