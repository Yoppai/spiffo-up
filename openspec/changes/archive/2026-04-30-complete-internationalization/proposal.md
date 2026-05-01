# Proposal: Internacionalización Completa (ch-04)

## Intent

Eliminar el 100% de strings hardcodeados en componentes UI. Actualmente la infraestructura i18n funciona (`i18next` + `react-i18next`) y los componentes globales (header, footer, settings, archived servers) ya usan `useTranslation()`. Sin embargo, `dashboard-panels.tsx`, `create-server-wizard-screen.tsx`, `server-dashboard-screen.tsx`, `pending-changes-modal.tsx` y otros contienen ~150 strings hardcodeados en mezcla ES/EN. Esto bloquea el criterio de aceptación del roadmap ch-04 y el PRD §3.3.

## Scope

### In Scope
- Extraer ~150 strings de ~12 archivos fuente a `src/locales/en.json` y `es.json`
- Organizar keys por dominio: `serverDashboard.*`, `wizard.*`, `pendingChanges.*`, `serverList.*`, `layout.*`, `formatters.*`, `catalog.*`, `errors.*`
- Refactor `formatServerStatus()` y `formatRconExposure()` para aceptar `t()` como parámetro
- Convertir `serverMenuItems` constante a hook `useServerMenuItems()`; eliminar `globalMenuItems` constante sobrante en `main-menu-view.tsx`
- Actualizar tests con asserts de strings exactos para que fijen idioma `en` antes de verificar
- Expandir spec `i18n-core` con requirements para las nuevas áreas

### Out of Scope
- Agregar idiomas nuevos (solo ES/EN)
- Cambiar lógica de negocio, flujos de usuario o navegación
- Modificar infraestructura i18n existente (`config.ts`, entry point init, `language-selector.tsx`)
- Traducir logs internos o mensajes de debug no visibles al usuario

## Capabilities

### New Capabilities
*None* — el capability base ya existe.

### Modified Capabilities
- `i18n-core`: expandir requirements para cubrir server dashboard panels, create server wizard, pending changes modal, main menu view / server list, layout shell, formatters y catálogo constants.

## Approach

Approach A: extracción completa en un solo cambio coherente.
- Refactor helpers puros (`formatServerStatus`, `formatRconExposure`) para recibir `t` como argumento; nunca usar hooks fuera del tree React
- Constantes de catálogo (`catalog.ts`) y status messages en `app-store.ts` (Zustand fuera de React) usarán `i18next.t()` directamente
- Menú de servidor pasa de constante de módulo a hook `useServerMenuItems()` (patrón existente con `useGlobalMenuItems()`)
- Tests: en setup, `i18next.changeLanguage('en')` antes de render para estabilizar asserts

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/screens/server-dashboard/dashboard-panels.tsx` | Modified | ~40 strings → `t()` keys |
| `src/screens/create-server-wizard/create-server-wizard-screen.tsx` | Modified | ~30 strings → `t()` keys |
| `src/screens/server-dashboard/server-dashboard-screen.tsx` | Modified | Hook `useServerMenuItems()`, traducir títulos/fallbacks |
| `src/components/pending-changes-modal.tsx` | Modified | Traducir título, acciones, hints |
| `src/screens/main-menu/main-menu-view.tsx` | Modified | Eliminar constante sobrante, traducir títulos |
| `src/screens/main-menu/main-menu-screen.tsx` | Modified | Traducir mensajes de error/éxito |
| `src/screens/main-menu/server-list.tsx` | Modified | Traducir header de tabla |
| `src/components/layout-shell.tsx` | Modified | Traducir mensaje terminal pequeña |
| `src/lib/formatters.ts` | Modified | Refactor `formatServerStatus()` para recibir `t` |
| `src/screens/create-server-wizard/catalog.ts` | Modified | Labels pasan a función que acepta `t` |
| `src/stores/app-store.ts` | Modified | `i18next.t()` para status messages |
| `src/locales/en.json` / `es.json` | Modified | Agregar dominios nuevos |
| `openspec/specs/i18n-core/spec.md` | Modified | Expandir requirements |
| Tests relacionados | Modified | Actualizar asserts de strings |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tests rompen por cambio de strings exactos | High | Actualizar tests en la misma tarea; fijar `changeLanguage('en')` en setup |
| Funciones puras fuera del React tree | Med | Refactor para aceptar `t` como argumento; nunca hooks fuera de componentes |
| Keys de catálogo usadas desde Zustand store | Med | Usar `i18next.t()` directo en store o pasar `t` desde handler UI |
| Tamaño del cambio (~12 archivos) | Med | Organizar por dominio en locales; un solo PR coherente |

## Rollback Plan

Revertir el commit. Los archivos de locale son aditivos (nuevas keys), no destructivos. Si algo falla, i18next fallback muestra la key literal; la UI sigue funcional.

## Dependencies

- `ch-01` (i18n base) completado — `i18next`/`react-i18next` ya instalados e inicializados.
- No dependencias externas nuevas.

## Success Criteria

- [ ] `grep` en `src/screens/`, `src/components/`, `src/lib/` no retorna strings user-facing hardcodeados (excluyendo comentarios, nombres CSS, React keys)
- [ ] `bun test` pasa
- [ ] Tests que verifican strings fijan idioma `en` antes de assert
- [ ] `es.json` y `en.json` contienen keys para todos los dominios nuevos
- [ ] Spec `i18n-core` actualizado con requirements para dashboard, wizard, modal, menú, lista, layout y formatters
