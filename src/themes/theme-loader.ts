import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ThemePalette } from './default-dark.js';

export type { ThemePalette };

const __dirname = dirname(fileURLToPath(import.meta.url));

export function isValidPalette(obj: unknown): obj is ThemePalette {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  if (typeof p.name !== 'string') return false;
  const c = p.colors as Record<string, unknown> | undefined;
  if (typeof c !== 'object' || c === null) return false;
  const required = ['primary', 'secondary', 'background', 'success', 'warning', 'error', 'focus', 'text', 'border', 'accent'] as const;
  return required.every((k) => typeof c[k] === 'string');
}

export function loadThemePalettes(): Record<string, ThemePalette> {
  const themesDir = join(__dirname);
  let files: string[] = [];
  try {
    files = readdirSync(themesDir).filter((f) => f.endsWith('.json'));
  } catch {
    // If directory doesn't exist or can't be read, return empty registry
    return {};
  }

  const registry: Record<string, ThemePalette> = {};
  for (const file of files) {
    if (file === '__fixtures__') continue;
    try {
      const content = readFileSync(join(themesDir, file), 'utf-8');
      const parsed = JSON.parse(content);
      if (isValidPalette(parsed)) {
        // Use the filename (without .json) as the theme ID
        const themeId = file.replace(/\.json$/, '');
        registry[themeId] = parsed;
      }
    } catch {
      // Skip invalid JSON files
    }
  }
  return registry;
}

// Load palettes at module scope (bundled themes)
export const themeRegistry: Record<string, ThemePalette> = loadThemePalettes();

/**
 * Loads external themes from runtime directories into the shared themeRegistry.
 * External themes override bundled themes with the same id.
 * Invalid JSON files are skipped safely.
 * Call this at app startup to enable runtime theme discovery without recompile.
 *
 * Scans:
 * - `process.cwd()/themes` (always, if exists)
 * - `SPIFFO_THEME_DIR` env var (if set and exists)
 */
export function loadExternalThemes(): void {
  // Compute external dirs dynamically to respect current process.cwd() at call time
  const externalDirs: string[] = [];
  const cwdThemes = join(process.cwd(), 'themes');
  if (existsSync(cwdThemes)) externalDirs.push(cwdThemes);
  const envDir = process.env.SPIFFO_THEME_DIR;
  if (envDir && existsSync(envDir)) externalDirs.push(envDir);

  for (const themeDir of externalDirs) {
    let files: string[] = [];
    try {
      files = readdirSync(themeDir).filter((f) => f.endsWith('.json'));
    } catch {
      // Skip directories that can't be read
      continue;
    }
    for (const file of files) {
      try {
        const content = readFileSync(join(themeDir, file), 'utf-8');
        const parsed = JSON.parse(content);
        if (isValidPalette(parsed)) {
          const themeId = file.replace(/\.json$/, '');
          themeRegistry[themeId] = parsed;
        }
      } catch {
        // Skip invalid JSON files safely
      }
    }
  }
}