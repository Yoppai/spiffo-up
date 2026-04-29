# Proposal: Dynamic Theme Palettes

## Intent

Reemplazar el tema hardcodeado por un sistema de paletas JSON dinámicas en `src/themes/`, con un selector que liste todos los temas disponibles y aplique preview inmediato al navegar. Corregir inconsistencias de persistencia (`'dark'` vs `'default-dark'`). Hacer `ThemePalette.border` y `ThemePalette.colors.accent` campos requeridos en el schema, garantizando que todo JSON de tema los defina. Soportar carga externa de temas en runtime desde `process.cwd()/themes` y `SPIFFO_THEME_DIR` sin recompilar.

## Scope

### In Scope
- Carga dinámica de paletas desde `src/themes/*.json`.
- Selector dinámico en Global Settings con preview inmediato al mover cursor.
- Persistencia lossless del `themeId` seleccionado en SQLite.
- `ThemePalette.border` y `ThemePalette.colors.accent` como campos requeridos en el schema/type.
- Actualización de componentes que leen `border` y `accent` para que nunca reciban `undefined`.
- Normalización de `'dark'` → `'default-dark'` en store y mapper.
- Carga externa de temas en runtime (`process.cwd()/themes`, `SPIFFO_THEME_DIR`).
- Tercera paleta bundled: `forest.json`.
- Background color del tema activo aplicado al layout raíz (`LayoutShell.tsx`).

### Out of Scope
- Extracción de strings hardcodeados (ch-04 i18n).
- Dirty state por panel.
- Temas editables en runtime o custom user themes via UI.

## Capabilities

### New Capabilities
- `theme-loader`: Descubrimiento y carga de archivos JSON en `src/themes/` + carga externa en runtime.
- `theme-selector-preview`: Selector dinámico con aplicación de preview inmediata.
- `external-theme-loading`: Temas externos desde `process.cwd()/themes` y `SPIFFO_THEME_DIR` sin recompilar.

### Modified Capabilities
- `theme-core`: Agregar `border` y `accent` como campos requeridos en `ThemePalette` schema/type; validar que todo JSON los incluya; corregir resolución de tema por ID; normalizar defaults.
- `layout-shell`: Aplicar `backgroundColor={theme.colors.background}` al `<Box>` raíz.

## Approach

1. Agregar `border: string` y `accent: string` como campos requeridos al type/schema de `ThemePalette`.
2. Crear `src/themes/default-dark.json` incluyendo `colors.border` y `colors.accent`; mantener `.ts` como re-export tipado.
3. Implementar `loadThemePalettes()` que lee `src/themes/*.json`, valida que cada paleta defina `border` y `accent`, y expone un registro `Record<string, ThemePalette>`.
4. Implementar `loadExternalThemes()` que carga temas desde `process.cwd()/themes` y `SPIFFO_THEME_DIR`, permitiendo override de temas bundled.
5. Actualizar `use-theme.ts` para consumir el registro dinámico en lugar del mapa hardcodeado.
6. Reescribir `ThemeSelector` para iterar el registro dinámico; aplicar preview vía `updateSettings({ theme: themeId })` inmediatamente al navegar con cursor.
7. Cambiar default del store de `'dark'` a `'default-dark'`; actualizar `settingsRowsToDomain` para preservar cualquier `theme` value leído de DB sin fallback destructivo.
8. Actualizar `global-settings-panel.tsx` para mostrar el label del tema actual dinámicamente.
9. Crear tercera paleta bundled `src/themes/forest.json` (verde).
10. Aplicar `backgroundColor={theme.colors.background}` al `<Box>` raíz en `LayoutShell.tsx`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/themes/*.json` | New | Archivos de paleta JSON descubribles + `forest.json` |
| `src/themes/default-dark.ts` | Modified | `border` + `accent` como requeridos; re-export tipado del JSON |
| `src/themes/theme-loader.ts` | Modified | Agregar `loadExternalThemes()`, `accent` en validación |
| `src/hooks/use-theme.ts` | Modified | Usar registro dinámico en lugar de mapa fijo |
| `src/screens/global-settings/theme-selector.tsx` | Modified | Lista dinámica + preview inmediato |
| `src/screens/global-settings/global-settings-panel.tsx` | Modified | Label de tema actual dinámico |
| `src/services/inventory-mappers.ts` | Modified | Fix preservación de `themeId` |
| `src/stores/settings-store.ts` | Modified | Default `theme: 'default-dark'` |
| `src/components/layout-shell.tsx` | Modified | `backgroundColor={theme.colors.background}` en root Box |
| `src/components/archived-list-view.tsx` | Modified | Leer `theme.colors.border` garantizado definido |
| `src/components/archived-detail-view.tsx` | Modified | Leer `theme.colors.border` garantizado definido |
| `index.tsx` | Modified | Llama `loadExternalThemes()` al startup |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ink no renderiza colores inválidos | Low | Validar que JSONs usen nombres de color Ink válidos |
| Ink `backgroundColor` no funciona en todos los terminals | Low | Usar colores Ink estándar (black, white); background es enhancement |
| Lectura sincrónica de JSON en startup | Low | `fs.readdirSync` + `JSON.parse` es negligible para <20 archivos |
| External theme override de `forest.json` bundled | Low | Comportamiento esperado; usuario controla su directorio |
| Breaking change en theme ID guardado | Med | Migración implícita: `'dark'` se sigue mapeando a `default-dark` |

## Rollback Plan

Revertir el commit. El fallback de `useTheme` (`?? defaultDarkTheme`) asegura que cualquier `themeId` desconocido renderice el tema oscuro por defecto.

## Dependencies

- ch-01 completado (Global Settings screen existe).
- `theme-core` spec escrito.

## Success Criteria

- [ ] `src/themes/*.json` contiene al menos `default-dark.json`, `ocean.json` y `forest.json` con paletas válidas.
- [ ] `ThemeSelector` lista dinámicamente todos los archivos JSON de `src/themes/`.
- [ ] Navegar con `↑↓` en el selector aplica preview inmediato sin reiniciar TUI.
- [ ] `themeId` seleccionado se persiste lossless en SQLite y se restaura al reiniciar.
- [ ] `ThemePalette.border` y `ThemePalette.colors.accent` son campos requeridos en el schema/type.
- [ ] Los componentes archivados leen `theme.colors.border` y nunca reciben `undefined`.
- [ ] Temas externos en `process.cwd()/themes` o `SPIFFO_THEME_DIR` se cargan sin recompilar.
- [ ] `LayoutShell` aplica `backgroundColor={theme.colors.background}` al root Box.
- [ ] `bun test` pasa.

## Non-goals

- No implementar ch-04 (extracción de strings a i18n).
- No introducir dirty-state por panel.
- No permitir que el usuario cree o edite temas via UI en runtime.
- No extraer hardcoded strings del código (ch-04).
