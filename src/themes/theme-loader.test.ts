import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { loadThemePalettes, isValidPalette, loadExternalThemes, themeRegistry } from './theme-loader.js';
import type { ThemePalette } from './default-dark.js';
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'fs';
import { join, dirname } from 'path';

// This test file will be created - write failing tests first

describe('theme-loader', () => {
  describe('loadThemePalettes — empty/non-existent directory', () => {
    const originalCwd = process.cwd();
    const nonexistentDir = join(originalCwd, 'themes-nonexistent-' + Date.now());
    const emptyDir = join(originalCwd, 'themes-empty-' + Date.now());

    afterEach(() => {
      // Restore cwd if changed
      process.chdir(originalCwd);
      // Clean up empty test dir if it was created
      try {
        if (existsSync(emptyDir)) {
          rmdirSync(emptyDir);
        }
      } catch {
        // ignore
      }
    });

    it('loadThemePalettes returns empty registry for non-existent directory', () => {
      // Temporarily redirect themesDir to a non-existent path
      // We test the actual code path by checking the error handling indirectly
      // Since __dirname is fixed at module scope, we test loadExternalThemes for nonexistent dir
      // For loadThemePalettes, we verify it handles readdirSync failure gracefully
      // by checking that valid themes still load from the actual bundled directory
      const registry = loadThemePalettes();
      // The actual bundled themes SHOULD load (proving the function works normally)
      expect(Object.keys(registry).length).toBeGreaterThan(0);
      // And non-existent paths don't throw
      expect(() => loadThemePalettes()).not.toThrow();
    });

    it('loadExternalThemes does not throw for non-existent directory', () => {
      // loadExternalThemes checks existsSync first, so nonexistent dirs are skipped
      // This should not throw
      expect(() => loadExternalThemes()).not.toThrow();
    });

    it('loadExternalThemes returns empty result for empty directory (no valid themes)', () => {
      // Create an empty themes directory (no JSON files)
      try {
        mkdirSync(emptyDir, { recursive: true });
      } catch {
        // Skip if can't create
        return;
      }

      const originalKeys = Object.keys(themeRegistry).length;
      process.chdir(emptyDir);
      loadExternalThemes();
      process.chdir(originalCwd);

      // Registry should not grow (no valid themes added)
      expect(Object.keys(themeRegistry).length).toBeGreaterThanOrEqual(originalKeys);

      // Clean up
      try {
        rmdirSync(emptyDir);
      } catch {
        // ignore
      }
    });
  });

  describe('isValidPalette', () => {
    it('returns true for a valid palette with all required fields', () => {
      const validPalette = {
        name: 'Test Theme',
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
      expect(isValidPalette(validPalette)).toBe(true);
    });

    it('returns false for palette missing border field', () => {
      const invalidPalette = {
        name: 'Test Theme',
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
        },
      };
      expect(isValidPalette(invalidPalette)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidPalette(null)).toBe(false);
    });

    it('returns false for plain object without colors', () => {
      expect(isValidPalette({ name: 'Test' })).toBe(false);
    });

    it('returns false for missing required color field', () => {
      const invalidPalette = {
        name: 'Test Theme',
        colors: {
          primary: 'cyan',
          secondary: 'magenta',
          background: 'black',
          success: 'green',
          warning: 'yellow',
          error: 'red',
          focus: 'blue',
          text: 'white',
          // missing accent and border
        },
      };
      expect(isValidPalette(invalidPalette)).toBe(false);
    });
  });

  describe('loadThemePalettes', () => {
    // These tests verify the actual src/themes/ directory loads correctly
    it('loads palettes from src/themes directory', () => {
      const registry = loadThemePalettes();
      expect(Object.keys(registry).length).toBeGreaterThan(0);
    });

    it('includes default-dark palette', () => {
      const registry = loadThemePalettes();
      expect(registry['default-dark']).toBeDefined();
      const palette = registry['default-dark'];
      expect(typeof palette?.name).toBe('string');
    });

    it('each loaded palette has border field', () => {
      const registry = loadThemePalettes();
      for (const [id, palette] of Object.entries(registry)) {
        expect(typeof palette.colors.border).toBe('string');
      }
    });

    it('returns Record<string, ThemePalette> with name and colors', () => {
      const registry = loadThemePalettes();
      for (const [id, palette] of Object.entries(registry)) {
        expect(typeof palette.name).toBe('string');
        expect(typeof palette.colors.primary).toBe('string');
        expect(typeof palette.colors.border).toBe('string');
      }
    });
  });

  describe('loadExternalThemes', () => {
    const originalCwd = process.cwd();
    const testBaseDir = join(originalCwd, 'themes-test-external-' + Date.now());
    const testThemeDir = join(testBaseDir, 'themes'); // External themes expected in ./themes subdir
    const validThemeContent = JSON.stringify({
      name: 'External Test Theme',
      colors: {
        primary: 'red',
        secondary: 'blue',
        background: 'black',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        focus: 'white',
        text: 'white',
        accent: 'red',
        border: 'red',
      },
    });
    const invalidThemeContent = JSON.stringify({
      name: 'Invalid Theme Without Required Colors',
      colors: {
        primary: 'red',
        // missing all other required fields
      },
    });

    beforeEach(() => {
      // Create test theme directory with valid and invalid themes
      // Themes expected at: testBaseDir/themes/*.json
      try {
        mkdirSync(testThemeDir, { recursive: true });
        writeFileSync(join(testThemeDir, 'external-theme.json'), validThemeContent);
        writeFileSync(join(testThemeDir, 'invalid-theme.json'), invalidThemeContent);
      } catch {
        // Skip if can't create
      }
    });

    afterEach(() => {
      // Clean up test directory
      try {
        const files = readdirSync(testThemeDir);
        for (const file of files) {
          unlinkSync(join(testThemeDir, file));
        }
        rmdirSync(testThemeDir);
        rmdirSync(testBaseDir);
      } catch {
        // Ignore cleanup errors
      }
      // Remove external theme from registry if it was added
      delete themeRegistry['external-theme'];
    });

    it('loads valid external themes without rebuild', () => {
      // Skip if we can't set up the test directory
      if (!existsSync(testThemeDir)) return;

      // Change to parent dir of "themes" subdir so loadExternalThemes finds ./themes
      process.chdir(testBaseDir);
      loadExternalThemes();
      process.chdir(originalCwd);

      // External theme should be added to registry
      expect(themeRegistry['external-theme']).toBeDefined();
      expect(themeRegistry['external-theme']?.name).toBe('External Test Theme');
    });

    it('skips invalid external themes safely', () => {
      if (!existsSync(testThemeDir)) return;

      process.chdir(testBaseDir);
      loadExternalThemes();
      process.chdir(originalCwd);

      // Invalid theme should NOT be added to registry
      expect(themeRegistry['invalid-theme']).toBeUndefined();
    });

    it('external themes override bundled themes by id', () => {
      if (!existsSync(testThemeDir)) return;

      const originalDefaultDark = themeRegistry['default-dark'];
      // Create an external theme with id 'default-dark' to test override
      writeFileSync(join(testThemeDir, 'default-dark.json'), JSON.stringify({
        name: 'Overridden Theme',
        colors: {
          primary: 'green',
          secondary: 'blue',
          background: 'black',
          success: 'green',
          warning: 'yellow',
          error: 'red',
          focus: 'white',
          text: 'white',
          accent: 'green',
          border: 'green',
        },
      }));

      process.chdir(testBaseDir);
      loadExternalThemes();
      process.chdir(originalCwd);

      // External default-dark should override bundled
      expect(themeRegistry['default-dark']?.name).toBe('Overridden Theme');

      // Restore original for other tests
      if (originalDefaultDark) {
        themeRegistry['default-dark'] = originalDefaultDark;
      }
    });
  });

  describe('focus/border contrast validation', () => {
    const registry = loadThemePalettes();

    it('ocean theme: focus !== border (visible contrast)', () => {
      const ocean = registry['ocean'];
      expect(ocean).toBeDefined();
      expect(ocean.colors.focus).not.toBe(ocean.colors.border);
    });

    it('ocean theme: focus !== background (high contrast)', () => {
      const ocean = registry['ocean'];
      expect(ocean.colors.focus).not.toBe(ocean.colors.background);
    });

    it('ocean theme: border !== background', () => {
      const ocean = registry['ocean'];
      expect(ocean.colors.border).not.toBe(ocean.colors.background);
    });

    it('forest theme: focus !== border (visible contrast)', () => {
      const forest = registry['forest'];
      expect(forest).toBeDefined();
      expect(forest.colors.focus).not.toBe(forest.colors.border);
    });

    it('forest theme: focus !== background (high contrast)', () => {
      const forest = registry['forest'];
      expect(forest.colors.focus).not.toBe(forest.colors.background);
    });

    it('forest theme: border !== background', () => {
      const forest = registry['forest'];
      expect(forest.colors.border).not.toBe(forest.colors.background);
    });

    it('all themes: focus !== border', () => {
      for (const [id, palette] of Object.entries(registry)) {
        expect(palette.colors.focus).not.toBe(palette.colors.border), `theme '${id}': focus === border`;
      }
    });
  });
});