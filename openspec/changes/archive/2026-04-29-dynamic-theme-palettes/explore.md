# Exploration: dynamic-theme-palettes (refresh post-bugfix + new scope)

## Current State

### Bugfixes applied (uncommitted, 12 files modified + new files)
- **header.tsx**: `ink-big-text` usa `font="tiny"`, sin título duplicado. ✅
- **theme-selector.tsx**: Lista dinámica desde `themeRegistry`, navegación vía cursor con `applyThemeSelection()`. ✅
- **global-settings-input.ts**: Usa `Object.keys(themeRegistry).length` dinámico (no hardcodeado). ✅
- **use-theme.ts**: Registry dinámico + alias `dark` → `default-dark` + fallback no destructivo. ✅
- **settings-store.ts**: Default `theme: 'default-dark'`. ✅
- **inventory-mappers.ts**: `settingsRowsToDomain` preserva cualquier `themeId` lossless. ✅
- **index.tsx**: Llama `loadExternalThemes()` en startup para soportar `process.cwd()/themes` + `SPIFFO_THEME_DIR`. ✅
- **default-dark.ts**: Re-export tipado del JSON con `accent` field. ✅
- **149 tests pass, 0 fail** (400 expect calls).

### Production theme JSONs existentes
| File | name | Primary | Secondary | Background |
|------|------|---------|-----------|------------|
| `default-dark.json` | Default Dark | cyan | magenta | black |
| `ocean.json` | Ocean | blue | cyan | black |

### ThemePalette tiene 10 colors fields (deviation from original 9-field spec)
`primary`, `secondary`, `background`, `success`, `warning`, `error`, `focus`, `text`, `accent`, `border`.

---

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/changes/dynamic-theme-palettes/proposal.md` | Stale | Out-of-scope external themes actually implemented; `accent` not mentioned |
| `openspec/changes/dynamic-theme-palettes/design.md` | Stale | Missing `loadExternalThemes()`, `accent`, file changes not updated |
| `openspec/changes/dynamic-theme-palettes/specs/theme-loader/spec.md` | Stale | Missing external themes spec |
| `openspec/changes/dynamic-theme-palettes/tasks.md` | Stale | Non-goals say no external themes; TDD table says 140 tests (now 149) |
| `src/themes/` | New | Add 3rd JSON palette (Forest) |
| `src/components/layout-shell.tsx` | Modify | Add `backgroundColor={theme.colors.background}` to root Box |
| `src/components/layout-shell.test.tsx` | Create | Test background color renders |
| `src/themes/theme-loader.test.ts` | Modify | Count increments with 3rd theme |
| `src/screens/global-settings/theme-selector.test.tsx` | Modify | Third theme rendering scenarios |

---

## Approaches

### Approach 1: Background in LayoutShell root Box (RECOMMENDED)

Añadir `backgroundColor={theme.colors.background}` al `<Box>` raíz en `layout-shell.tsx`. Esto aplica el fondo a todas las pantallas (MainMenu, ServerDashboard, Wizard) porque todas usan LayoutShell.

- **Pros**: Una sola línea de cambio, cubre toda la app, theme-driven automático.
- **Cons**: Ink no renderiza background en todas las terminales (behavior terminal-specific).
- **Effort**: Low (1 property add, 1 test update).

### Approach 2: Background in router.tsx Box

Envolver `<Routes>` en `<Box>` con backgroundColor en `router.tsx`.

- **Pros**: El usuario señaló router.tsx explícitamente.
- **Cons**: Router no debería tener lógica visual; layout-shell ya es el root layout; duplicaría anidación de Boxes.
- **Effort**: Low but wrong abstraction layer.

### Approach 3: Background in DashboardScreen/DashboardFrame

Agregar `<Box backgroundColor>` en `DashboardFrame` (main-menu-screen.tsx).

- **Pros**: Afecta solo al DashboardScreen.
- **Cons**: ServerDashboard y MainMenuView ya usan LayoutShell; DashboardFrame es un Fragment. Mejor LayoutShell que es single source of truth.
- **Effort**: Low but más limitado que Approach 1.

### Approach 4: New theme JSON — "Forest"

Paleta verde, claramente distinta de Default Dark (cyan) y Ocean (blue).

Suggested palette: primary=`green`, secondary=`lime`, background=`black`, success=`green`, warning=`yellow`, error=`red`, focus=`lime`, text=`white`, accent=`green`, border=`green`.

- **Pros**: Tercer tema visualmente único, sin riesgo de confusión.
- **Effort**: Low (1 JSON file, tests auto-adaptan).

---

## Recommendation

1. **Background color**: Approach 1 — agregar `backgroundColor` en `LayoutShell.tsx`. Es la capa correcta, un solo cambio, theme-driven. El usuario mencionó `router.tsx` pero el diseño real pone el layout en LayoutShell.

2. **New theme**: "Forest" — green palette en `src/themes/forest.json`.

3. **Update specs**: Sync delta specs to main specs, actualizar proposal/design/tasks para reflejar:
   - External themes (`loadExternalThemes`, `SPIFFO_THEME_DIR`, `process.cwd()/themes`)
   - `accent` field en ThemePalette (10 colors)
   - Nueva paleta Forest
   - Background color en LayoutShell

---

## Risks

- **Ink background rendering**: `backgroundColor` en Ink Box depende del terminal. No todos los terminals renderizan background colors. Mitigación: usar colores Ink estándar (black, white, etc.) que todos soportan.
- **Theme JSON count**: Agregar un 3er tema incrementa el registro. Tests existentes verifican `Object.keys(registry).length` — pueden necesitar ajuste si hacen assertions exactas (actualmente verifican `> 0` o skip si <2, safe).
- **External theme override**: Si el usuario tiene un tema externo `forest.json` en `process.cwd()/themes`, sobreescribe el bundled. Es comportamiento esperado/documentado.

---

## Ready for Proposal

Yes. Proceed with:
1. Sync delta specs → main specs (external themes, accent field)
2. Update proposal/design/tasks for new scope (Forest theme + background color)
3. Create implementation tasks: forest.json, LayoutShell backgroundColor, test updates
