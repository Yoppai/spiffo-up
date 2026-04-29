# Design: Dynamic Theme Palettes

## Technical Approach

Reemplazar el mapa hardcodeado de temas por un registro dinámico cargado desde `src/themes/*.json` al iniciar la app y extendido por carga externa en runtime. Validar cada JSON contra el schema `ThemePalette` (ahora con `border` y `accent` requeridos, 10 campos totales). `useTheme` resuelve la paleta por `themeId` vía el registro, aplicando alias `dark` → `default-dark` y fallback no destructivo. `ThemeSelector` itera el registro y aplica preview inmediato con `updateSettings({ theme })` al navegar. Se corrige `settingsRowsToDomain` para preservar `themeId` lossless desde SQLite. `LayoutShell` aplica `backgroundColor={theme.colors.background}` al `<Box>` raíz.

## Architecture Decisions

| Decision | Options | Tradeoffs | Chosen |
|----------|---------|-----------|--------|
| Carga de paletas | `fs.readdirSync` + `JSON.parse` sincrónico al importar módulo | Negligible para <20 archivos; evita async en hooks | Sincrónico en módulo `theme-loader.ts` |
| Validación de JSON | Zod schema vs función manual | Zod añade dependencia; función manual es 10 líneas y sin bundle extra | Función `isValidPalette()` con type guard |
| Preview inmediato | `updateSettings` directo vs estado transitorio | Directo escribe SQLite por flecha; transitorio añade complejidad | `updateSettings` directo; SQLite local, settings pequeño |
| Persistencia legacy | Normalizar en `useTheme` (resolución) vs migrar DB | Resolución no muta store ni DB; preserva IDs desconocidos | Resolución en `useTheme`, mapper sin fallback destructivo |
| `default-dark.ts` | Re-export del JSON vs duplicar objeto | Re-export mantiene single source of truth | `default-dark.ts` importa JSON y exporta tipado |
| External themes | Carga en startup via `loadExternalThemes()` | Permite añadir temas sin recompilar; override de bundled por id | `loadExternalThemes()` llamada en `index.tsx` |
| Background color | LayoutShell root Box vs router.tsx Box | LayoutShell es el root layout real; router solo maneja rutas | LayoutShell root `<Box backgroundColor={theme.colors.background}>` |

## Data Flow

```
Startup
  └── index.tsx: loadExternalThemes()
          └── src/themes/*.json ──→ loadThemePalettes() ──→ Record<string, ThemePalette> (bundled)
          └── process.cwd()/themes + SPIFFO_THEME_DIR ──→ loadExternalThemes() ──→ themeRegistry (extends/overrides)

Settings load
  └── DB rows ──→ settingsRowsToDomain() ──→ settings.theme (preservado lossless)

ThemeSelector focus
  └── cursor change ──→ applyThemeSelection(cursor)
         └── updateSettings({ theme: themeId }) ──→ Zustand store ──→ SQLite

Component render
  └── useTheme() ──→ registry[themeId] ?? registry['default-dark']
         └── Theme objeto ──→ Ink <Text color={...} />
         └── LayoutShell root Box ──→ <Box backgroundColor={theme.colors.background}>
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/themes/default-dark.json` | Create | Paleta JSON con `colors.border` y `colors.accent` (10 campos) |
| `src/themes/ocean.json` | Create | Segunda paleta bundled (blue/cyan) |
| `src/themes/forest.json` | Create | Tercera paleta bundled (green/lime) — nueva |
| `src/themes/default-dark.ts` | Modify | Importa JSON, valida y re-exporta como `ThemePalette` + `accent` requerido |
| `src/themes/theme-loader.ts` | Modify | Agregar `loadExternalThemes()`, `accent` en validación, 10 campos requeridos |
| `src/hooks/use-theme.ts` | Modify | Usa registro dinámico; resuelve alias `dark` → `default-dark`; fallback no destructivo |
| `src/screens/global-settings/theme-selector.tsx` | Modify | Lista dinámica desde registro; preview inmediato al navegar |
| `src/screens/global-settings/global-settings-panel.tsx` | Modify | Label de tema actual resuelto dinámicamente desde registro |
| `src/stores/settings-store.ts` | Modify | Default `theme: 'default-dark'` |
| `src/services/inventory-mappers.ts` | Modify | `settingsRowsToDomain` preserva `values.theme` sin fallback destructivo |
| `src/screens/archived-servers/archived-list-view.tsx` | Modify | `theme.colors.border` ahora tipado como `string` |
| `src/screens/archived-servers/archived-detail-view.tsx` | Modify | `theme.colors.border` ahora tipado como `string` |
| `src/components/layout-shell.tsx` | Modify | Root `<Box>` con `backgroundColor={theme.colors.background}` — nueva |
| `index.tsx` | Modify | Llama `loadExternalThemes()` al startup — nueva |

## Interfaces / Contracts

```typescript
// src/themes/default-dark.ts
export interface ThemePalette {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    success: string;
    warning: string;
    error: string;
    focus: string;
    text: string;
    accent: string;       // ← requerido (10 campos total)
    border: string;       // ← requerido
  };
}

// src/themes/theme-loader.ts
export function loadThemePalettes(): Record<string, ThemePalette>;
export function loadExternalThemes(): void;  // runtime external themes
export const themeRegistry: Record<string, ThemePalette>;  // shared, mutated by loadExternalThemes

// src/hooks/use-theme.ts
export interface Theme {
  colors: ThemePalette['colors'];
}
export function useTheme(): Theme;
```

### Validación de JSON (10 campos requeridos)

```typescript
function isValidPalette(obj: unknown): obj is ThemePalette {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  if (typeof p.name !== 'string') return false;
  const c = p.colors as Record<string, unknown> | undefined;
  if (typeof c !== 'object' || c === null) return false;
  const required = ['primary','secondary','background','success','warning','error','focus','text','accent','border'] as const;
  return required.every((k) => typeof c[k] === 'string');
}
```

### External Theme Loading

```typescript
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
  const externalDirs: string[] = [];
  const cwdThemes = join(process.cwd(), 'themes');
  if (existsSync(cwdThemes)) externalDirs.push(cwdThemes);
  const envDir = process.env.SPIFFO_THEME_DIR;
  if (envDir && existsSync(envDir)) externalDirs.push(envDir);
  // ... loads and merges into themeRegistry
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `loadThemePalettes` con JSON válido, sin border/accent, directorio vacío | `bun test`, archivos de fixture reales |
| Unit | `loadExternalThemes` carga/override/skip invalid | `bun test`, temp dir con themes fixtures |
| Unit | `useTheme` resuelve alias, unknown ID, registro dinámico | `ink-testing-library` + Zustand store reset |
| Unit | `settingsRowsToDomain` preserva `theme` lossless | assertions directos sobre mapper |
| Integration | `ThemeSelector` lista temas y aplica preview | render con `ink-testing-library`, simular cursor |
| Integration | `LayoutShell` aplica background color | render con theme, verificar `backgroundColor` prop |

## Background Color Rationale

**为什么不放在 `router.tsx`**: El usuario mencionó `router.tsx` como posible ubicación, pero:

1. `router.tsx` solo maneja rutas (`MemoryRouter`, `Routes`, `Route`), sin lógica visual
2. `LayoutShell` es el root layout real de la app — todos los screens lo usan
3. `LayoutShell` recibe `theme` indirectamente via `useTheme()` — no necesita props adicionales
4. Un solo cambio en `LayoutShell` cubre todas las pantallas (Dashboard, MainMenu, Wizard)

**Approach**: `<Box backgroundColor={theme.colors.background}>` en el root Box de `LayoutShell`. Esto aplica el fondo temático a toda la app sin duplicar anidación de Boxes.

**Terminal compatibility**: Ink `backgroundColor` depende del terminal. Usar colores Ink estándar (black, white, etc.) que todos soportan. El background es enhancement; si no renderiza, la app sigue funcionando.

## Migration / Rollout

No migration required. El alias `dark` → `default-dark` en `useTheme` garantiza compatibilidad con valores legacy en DB sin mutar datos existentes.

## Open Questions

- None.
